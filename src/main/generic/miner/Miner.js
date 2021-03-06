class Miner extends Observable {
    /**
     * @param {Blockchain} blockchain
     * @param {Mempool} mempool
     * @param {Address} minerAddress
     *
     * @listens Mempool#transaction-added
     * @listens Mempool#transaction-ready
     */
    constructor(blockchain, mempool, minerAddress) {
        super();
        /** @type {Blockchain} */
        this._blockchain = blockchain;
        /** @type {Mempool} */
        this._mempool = mempool;
        /** @type {Address} */
        this._address = minerAddress;

        /**
         * Number of hashes computed since the last hashrate update.
         * @type {number}
         * @private
         */
        this._hashCount = 0;

        /**
         * Timestamp of the last hashrate update.
         * @type {number}
         * @private
         */
        this._lastHashrate = 0;

        /**
         * Hashrate computation interval handle.
         * @private
         */
        this._hashrateWorker = null;

        /**
         * The current hashrate of this miner.
         * @type {number}
         * @private
         */
        this._hashrate = 0;

        /**
         * The last hash counts used in the moving average.
         * @type {Array.<number>}
         * @private
         */
        this._lastHashCounts = [];

        /**
         * The total hashCount used in the current moving average.
         * @type {number}
         * @private
         */
        this._totalHashCount = 0;

        /**
         * The time elapsed for the last measurements used in the moving average.
         * @type {Array.<number>}
         * @private
         */
        this._lastElapsed = [];

        /**
         * The total time elapsed used in the current moving average.
         * @type {number}
         * @private
         */
        this._totalElapsed = 0;

        // Flag indicating that the mempool has changed since we started mining the current block.
        this._mempoolChanged = false;

        // Listen to changes in the mempool which evicts invalid transactions
        // after every blockchain head change and then fires 'transactions-ready'
        // when the eviction process finishes. Restart work on the next block
        // with fresh transactions when this fires.
        this._mempool.on('transactions-ready', () => this._startWork());

        // Immediately start processing transactions when they come in.
        this._mempool.on('transaction-added', () => this._mempoolChanged = true);
    }

    startWork() {
        if (this.working) {
            return;
        }

        // Initialize hashrate computation.
        this._hashCount = 0;
        this._lastElapsed = [];
        this._lastHashCounts = [];
        this._totalHashCount = 0;
        this._totalElapsed = 0;
        this._lastHashrate = Date.now();
        this._hashrateWorker = setInterval(() => this._updateHashrate(), 1000);

        // Tell listeners that we've started working.
        this.fire('start', this);

        // Kick off the mining process.
        this._startWork();
    }

    async _startWork() {
        // XXX Needed as long as we cannot unregister from transactions-ready events.
        if (!this.working) {
            return;
        }

        // Construct next block.
        const block = await this._getNextBlock();
        const buffer = block.header.serialize();
        this._mempoolChanged = false;

        Log.i(Miner, `Starting work on ${block.header}, transactionCount=${block.transactionCount}, hashrate=${this._hashrate} H/s`);

        // Start hashing.
        this._mine(block, buffer);
    }


    async _mine(block, buffer) {
        // If the mempool has changed, restart work with the changed transactions.
        if (this._mempoolChanged) {
            this._startWork();
            return;
        }

        // Abort mining if the blockchain head changed.
        if (!this._blockchain.headHash.equals(block.prevHash)) {
            return;
        }

        // Abort mining if the user stopped the miner.
        if (!this.working) {
            return;
        }

        // Reset the write position of the buffer before re-using it.
        buffer.writePos = 0;

        // Compute hash and check if it meets the proof of work condition.
        const isPoW = await block.header.verifyProofOfWork(buffer);

        // Keep track of how many hashes we have computed.
        this._hashCount++;

        // Check if we have found a block.
        if (isPoW) {
            // Tell listeners that we've mined a block.
            this.fire('block-mined', block, this);

            // Push block into blockchain.
            this._blockchain.pushBlock(block);
        } else {
            // Increment nonce.
            block.header.nonce++;

            // Continue mining.
            this._mine(block, buffer);
        }
    }

    /**
     * @return {Promise.<Block>}
     * @private
     */
    async _getNextBlock() {
        const nextTarget = await this._blockchain.getNextTarget();
        const interlink = await this._getNextInterlink(nextTarget);
        const body = this._getNextBody();
        const header = await this._getNextHeader(nextTarget, interlink, body);
        return new Block(header, interlink, body);
    }

    /**
     * @param {number} nextTarget
     * @param {BlockInterlink} interlink
     * @param {BlockBody} body
     * @return {Promise.<BlockHeader>}
     * @private
     */
    async _getNextHeader(nextTarget, interlink, body) {
        const prevHash = this._blockchain.headHash;
        const interlinkHash = await interlink.hash();

        // Compute next accountsHash.
        const accounts = await this._blockchain.accounts.transaction();
        let accountsHash;
        try {
            await accounts.commitBlockBody(body);
            accountsHash = await accounts.hash();
            await accounts.abort();
        } catch (e) {
            await accounts.abort();
            throw new Error('Invalid block body');
        }

        const bodyHash = await body.hash();
        const height = this._blockchain.height + 1;
        const timestamp = this._getNextTimestamp();
        const nBits = BlockUtils.targetToCompact(nextTarget);
        const nonce = Math.round(Math.random() * 100000);
        return new BlockHeader(prevHash, interlinkHash, bodyHash, accountsHash, nBits, height, timestamp, nonce);
    }

    /**
     * @param {number} nextTarget
     * @returns {Promise.<BlockInterlink>}
     * @private
     */
    _getNextInterlink(nextTarget) {
        return this._blockchain.head.getNextInterlink(nextTarget);
    }

    /**
     * @return {BlockBody}
     * @private
     */
    _getNextBody() {
        // Get transactions from mempool (default is maxCount=5000).
        // TODO Completely fill up the block with transactions until the size limit is reached.
        const transactions = this._mempool.getTransactions();
        return new BlockBody(this._address, transactions);
    }

    /**
     * @return {number}
     * @private
     */
    _getNextTimestamp() {
        const now = Math.floor(Date.now() / 1000);
        return Math.max(now, this._blockchain.head.timestamp + 1);
    }

    /**
     * @fires Miner#stop
     */
    stopWork() {
        // TODO unregister from blockchain head-changed events.
        if (!this.working) {
            return;
        }

        clearInterval(this._hashrateWorker);
        this._hashrateWorker = null;
        this._hashrate = 0;
        this._lastElapsed = [];
        this._lastHashCounts = [];
        this._totalHashCount = 0;
        this._totalElapsed = 0;

        // Tell listeners that we've stopped working.
        this.fire('stop', this);

        Log.i(Miner, 'Stopped work');
    }

    /**
     * @fires Miner#hashrate-changed
     * @private
     */
    _updateHashrate() {
        const elapsed = (Date.now() - this._lastHashrate) / 1000;
        const hashCount = this._hashCount;
        // Enable next measurement.
        this._hashCount = 0;
        this._lastHashrate = Date.now();

        // Update stored information on moving average.
        this._lastElapsed.push(elapsed);
        this._lastHashCounts.push(hashCount);
        this._totalElapsed += elapsed;
        this._totalHashCount += hashCount;

        if (this._lastElapsed.length > Miner.MOVING_AVERAGE_MAX_SIZE) {
            const oldestElapsed = this._lastElapsed.shift();
            const oldestHashCount = this._lastHashCounts.shift();
            this._totalElapsed -= oldestElapsed;
            this._totalHashCount -= oldestHashCount;
        }

        this._hashrate = Math.round(this._totalHashCount / this._totalElapsed);

        // Tell listeners about our new hashrate.
        this.fire('hashrate-changed', this._hashrate, this);
    }

    /** @type {Address} */
    get address() {
        return this._address;
    }

    /** @type {boolean} */
    get working() {
        return !!this._hashrateWorker;
    }

    /** @type {number} */
    get hashrate() {
        return this._hashrate;
    }
}
Miner.MOVING_AVERAGE_MAX_SIZE = 10;
Class.register(Miner);
