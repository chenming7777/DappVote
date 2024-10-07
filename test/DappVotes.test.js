const { expect } = require("chai");
const { expectRevert } = require("@openzeppelin/test-helpers");

describe('Contract', () => {
    let contract, result

    const description = 'Lorem Ipsum'
    const title = 'Product Voting'
    const image = 'https://image.png'
    const starts = Date.now() - 10 * 60 * 1000
    const ends = Date.now() + 10 * 60 * 1000
    const pollId = 1
    const contestantId = 1

    const avatar1 = 'https://avatar1.png'
    const name1 = "chenming"
    const avatar2 = 'https://avatar2.png'
    const name2 = "jookiat"

    beforeEach(async () => {
        const Contract = await ethers.getContractFactory("DappVotes")
            ;[developer, contestant1, contestant2, voter1, voter2, voter3] = await ethers.getSigners()

        contract = await Contract.deploy()
        await contract.deployed()
    })

    describe('Poll Mgt.', () => {
        describe('Success', () => {
            it('should confrim poll creation success', async () => {
                result = await contract.getPolls()
                expect(result).to.have.lengthOf(0)

                await contract.createPoll(image, title, description, starts, ends)

                result = await contract.getPolls()
                expect(result).to.have.lengthOf(1)

                result = await contract.getPoll(pollId)
                expect(result.title).to.be.equal(title)
                expect(result.director).to.be.equal(developer.address)


            })
            it('should confrim poll update success', async () => {
                await contract.createPoll(image, title, description, starts, ends)

                result = await contract.getPoll(pollId)
                expect(result.title).to.be.equal(title)

                await contract.updatePoll(pollId, image, 'New title', description, starts, ends)

                result = await contract.getPoll(pollId)
                expect(result.title).to.be.equal('New title')
            })

            it('should confirm poll deletion success', async () => {
                await contract.createPoll(image, title, description, starts, ends)

                result = await contract.getPolls()
                expect(result).to.have.lengthOf(1)

                result = await contract.getPoll(pollId)
                expect(result.deleted).to.be.equal(false)

                await contract.deletePoll(pollId)

                result = await contract.getPolls()
                expect(result).to.have.lengthOf(0)

                result = await contract.getPoll(pollId)
                expect(result.deleted).to.be.equal(true)
            })
        })

        describe('Failure', () => {
            it('should confirm poll creation failures', async () => {
                await expectRevert(
                    contract.createPoll('', title, description, starts, ends),
                    'Image URL cannot be empty'
                )
                await expectRevert(
                    contract.createPoll(image, title, description, 0, ends),
                    'Start date must be greater than 0'
                )
                await expectRevert(
                    contract.createPoll(image, title, description, starts, starts),
                    'End date must be greater than start date'
                )
            })
            it('should confirm poll update failures', async () => {
                await expectRevert(
                    contract.updatePoll(100, image, 'New Title', description, starts, ends),
                    'Poll not found'
                )
            })

            it('should confirm poll deletion failures', async () => {
                await expectRevert(contract.deletePoll(100), 'Poll not found')
            })
        })
    })

    describe('Poll Contest', () => {
        beforeEach(async () => {
            await contract.createPoll(image, title, description, starts, ends);
        });
    
        describe('Success', () => {
            it('Should confirm contest entry success', async () => {
                result = await contract.getPoll(pollId);
                expect(result.contestants.toNumber()).to.be.equal(0);
    
                await contract.connect(contestant1).contest(pollId, name1, avatar1);
                await contract.connect(contestant2).contest(pollId, name2, avatar2);
    
                result = await contract.getPoll(pollId);
                expect(result.contestants.toNumber()).to.be.equal(2);
    
                result = await contract.getContestants(pollId);
                expect(result).to.have.lengthOf(2);
            });
        });
    
        describe('Failure', () => {
            it('should confirm contest entry failure', async () => {
                await expectRevert(
                    contract.connect(contestant1).contest(100, name1, avatar1),
                    'Poll not found'
                );
                await expectRevert(
                    contract.connect(contestant1).contest(pollId, '', avatar1),
                    'Name cannot be empty'
                );
    
                await contract.connect(contestant1).contest(pollId, name1, avatar1);
                await expectRevert(
                    contract.connect(contestant1).contest(pollId, name1, avatar1),
                    'Already contested'
                );
            });
        });
    });    
})