class BlockMessage extends Message {
    /**
     * @param {Block} block
     */
    constructor(block) {
        super(Message.Type.BLOCK);
        // TODO Bitcoin block messages start with a block version
        /** @type {Block} */
        this._header = block;
    }

    /**
     * @param {SerialBuffer} buf
     * @return {BlockMessage}
     */
    static unserialize(buf) {
        Message.unserialize(buf);
        const block = Block.unserialize(buf);
        return new BlockMessage(block);
    }

    /**
     * @param {SerialBuffer} [buf]
     * @return {SerialBuffer}
     */
    serialize(buf) {
        buf = buf || new SerialBuffer(this.serializedSize);
        super.serialize(buf);
        this._header.serialize(buf);
        super._setChecksum(buf);
        return buf;
    }

    /** @type {number} */
    get serializedSize() {
        return super.serializedSize
            + this._header.serializedSize;
    }

    /** @type {Block} */
    get block() {
        return this._header;
    }
}
Class.register(BlockMessage);
