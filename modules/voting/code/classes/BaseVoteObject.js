/** The base class for objects that interact with a VotingClient
 * @typedef {BaseVoteObject} BaseVoteObject
 */
 class BaseVoteObject{

    /** The voting client this object uses for voting updates
     * @type {VotingClient}
     */
    votingClient;

    /** Create a new BaseVoteObject, giving it a VotingClient
     * @param {VotingClient} votingClient 
     */
    constructor(votingClient){
        this.votingClient = votingClient;
    }
}

module.exports = {
    BaseVoteObject: BaseVoteObject
}