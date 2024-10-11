import { ethers } from 'ethers';
import address from '@/artifacts/contractAddress.json';
import abi from '@/artifacts/contracts/DappVotes.sol/DappVotes.json';
import { globalActions } from '@/store/globalSlices';
import { store } from '@/store';
import { PollParams, PollStruct } from '@/utils/types';


const { setWallet, setPolls } = globalActions
const ContractAddress = address.address
const ContractAbi = abi.abi
let ethereum: any
let tx: any

if (typeof window !== 'undefined') {
  ethereum = (window as any).ethereum
}

const connectWallet = async () => {
  try {
    if (!ethereum) return reportError('Please install MetaMask')
    const accounts = await ethereum.request?.({ method: 'eth_requestAccounts' })
    store.dispatch(setWallet(accounts?.[0]))
  } catch (error) {
    reportError(error)
  }
}


const checkWallet = async () => {
  try {
    if (!ethereum) return reportError('Please install MetaMask')
    const accounts = await ethereum.request?.({ method: 'eth_accounts' })

    ethereum.on('chainChanged', async () => {
      window.location.reload()
    })

    ethereum.on('accountChanged', async () => {
      store.dispatch(setWallet(accounts?.[0]))
      await checkWallet()
    })

    if (accounts?.length) {
      store.dispatch(setWallet(accounts?.[0]))

    } else {
      store.dispatch(setWallet(''))
      reportError('Please connect your wallet, no account found')
    }
  } catch (error) {
    reportError(error)
  }
}


const getEthereumContract = async () => {
  const accounts = await ethereum?.request?.({ method: 'eth_accounts' })
  const provider = accounts?.[0]
    ? new ethers.providers.Web3Provider(ethereum)
    : new ethers.providers.JsonRpcProvider(process.env.NEXT_APP_RPC_URL)
  const wallet = accounts?.[0] ? null : ethers.Wallet.createRandom()
  const signer = provider.getSigner(accounts?.[0] ? undefined : wallet?.address)

  const contract = new ethers.Contract(ContractAddress, ContractAbi, signer)
  return contract

}


const createPoll = async (data: PollParams) => {
  if (!ethereum) {
    reportError('Please install MetaMask')
    return Promise.reject(new Error('Metamask not installed'))
  } 
  try {
    const contract = await getEthereumContract()
    const { image, title, description, startsAt, endsAt } = data
    const tx = await contract.createPoll(image, title, description, startsAt, endsAt)

    await tx.wait()

    const polls = await getPolls()
    store.dispatch(setPolls(polls))


    return Promise.resolve(tx)
  } catch (error) {
    reportError(error)
    return Promise.reject(error)
  }
}
const getPolls = async (): Promise<PollStruct[]> => {
  const contract = await getEthereumContract()
  const polls = await contract.getPolls()
  return structurePolls(polls)
}

const getPoll = async (id: number): Promise<PollStruct> => {
  const contract = await getEthereumContract()
  const polls = await contract.getPoll(id)
  return structurePolls([polls])[0]
}

const structurePolls = (polls: any[]): PollStruct[] =>
  polls
    .map((poll) => ({
      id: Number(poll.id),
      image: poll.image,
      title: poll.title,
      description: poll.description,
      votes: Number(poll.votes),
      contestants: Number(poll.contestants),
      deleted: poll.deleted,
      director: poll.director.toLowerCase(),
      startsAt: Number(poll.startsAt),
      endsAt: Number(poll.endsAt),
      timestamp: Number(poll.timestamp),
      voters: poll.voters.map((voter: string) => voter.toLowerCase()),
      avatars: poll.avatars,
    }))
    .sort((a, b) => b.timestamp - a.timestamp)



const reportError = (error: any) => {
  console.error(error)
}

export {connectWallet, checkWallet, createPoll, getPolls, getPoll}