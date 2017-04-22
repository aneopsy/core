
describe('Accounts', () => {

    it('can apply and revert a block', (done) => {
        const block = new Block();

        const accountsHash1 = Accounts.hash();
        Accounts.applyBlock(block);
        Accounts.revertBlock(block);
        const accountsHash2 = Accounts.hash();

        expect(accountsHash1.equals(accountsHash2)).toEqual(true);
        done();
    });

    it('put and get an account', (done) => {
        const balance = 42;
        const nonce = 192049;
        const accountState1 = new AccountState(balance, nonce);
        const accountAddress = new AccountAddress(Dummy.address2);

        async function test() {
            const account = await Accounts.getAccountState(accountAddress);
            expect(accountState1.nonce).tobe(accountState2.nonce);
            done();
        }

        //test();
        expect(true).toBe(false);
    });
});
