describe('Block', () => {
    let testBlockchain, block;

    beforeEach(function (done) {
        (async function () {
            // create testing blockchain with only genesis and dummy users
            testBlockchain = await TestBlockchain.createVolatileTest(0);
            block = await testBlockchain.createBlock();
        })().then(done, done.fail);
    });

    it('must have a well defined header (116 bytes)', () => {
        const body = block.body;
        expect(() => {
            const test1 = new Block(undefined, body);
        }).toThrow('Malformed header');

        expect(() => {
            const test1 = new Block(null, body);
        }).toThrow('Malformed header');

        expect(() => {
            const test1 = new Block(1, body);
        }).toThrow('Malformed header');

        expect(() => {
            const test1 = new Block(new Uint8Array(101), body);
        }).toThrow('Malformed header');

        expect(() => {
            const test1 = new Block(block, body);
        }).toThrow('Malformed header');
    });

    it('must have a well defined interlink', () => {
        const header = block.header;
        expect(() => {
            const test1 = new Block(header, undefined);
        }).toThrow('Malformed interlink');

        expect(() => {
            const test1 = new Block(header, null);
        }).toThrow('Malformed interlink');

        expect(() => {
            const test1 = new Block(header, 1);
        }).toThrow('Malformed interlink');

        expect(() => {
            const test1 = new Block(header, new Uint8Array(101));
        }).toThrow('Malformed interlink');

        expect(() => {
            const test1 = new Block(header, block);
        }).toThrow('Malformed interlink');
    });

    it('must have a well defined body (optional)', () => {
        const header = block.header;
        const interlink = block.interlink;
        expect(() => {
            const test1 = new Block(header, interlink, 1);
        }).toThrow('Malformed body');

        expect(() => {
            const test1 = new Block(header, interlink, new Uint8Array(101));
        }).toThrow('Malformed body');

        expect(() => {
            const test1 = new Block(header, interlink, block);
        }).toThrow('Malformed body');
    });

    it('is serializable and unserializable', () => {
        const size = block.header.serializedSize + block.interlink.serializedSize + block.body.serializedSize + 1 /*bodyPresent*/;
        const block2 = Block.unserialize(block.serialize());

        expect(block2.serializedSize).toBe(size);
        expect(BufferUtils.equals(block, block2)).toBe(true);
    });
});
