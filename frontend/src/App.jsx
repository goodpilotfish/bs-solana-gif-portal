import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

// Solana setup

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

import idl from './idl.json';
import kp from './keypair.json';

import { Buffer } from 'buffer';
window.Buffer = Buffer;

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

// Get Keypair
const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
const network = clusterApiUrl('devnet');

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed"
}

const LAMPORTS_PER_SOLANA = 1000000000;

// Constants
const TWITTER_HANDLE = '_buildspace';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {

  // States
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  // Solana provider
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );

    return provider;
  }

  // checker
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;
      if (solana && solana.isPhantom) {
        console.log('Phantom wallet found!');

        const response = await solana.connect({ onlyIfTrusted: true });
        console.log(
          'Connected with Public Key:',
          response.publicKey.toString()
        );

        setWalletAddress(response.publicKey);

      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // button logic
  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey);
    }
  };

  // button UI
  const renderNotConnectedContainer = () => {
    return <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('');
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF successfully sent to program", inputValue)

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const tipUser = async (donateTo) => {
    console.log('Tipping from:', walletAddress);
    console.log('Tipping to:', donateTo);
    console.log('Program PubKey *NOT SENDER*:', baseAccount.publicKey.toString());

    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.tipSol({
        accounts: {
          from: walletAddress,
          to: donateTo,
          systemProgram: SystemProgram.programId,
        },
      });
      console.log("Tipped: ", donateTo);
    } catch (error) {
      console.log("Error tipping:", error)
    }
  }

  const createTransaction = async (instructions) => {
    const anyTransaction = new web3.Transaction().add(instructions);
    anyTransaction.feePayer = getProvider().wallet.publicKey;
    console.log('Setting fee payer');
    console.log('Getting Recent Blockhash');
    anyTransaction.recentBlockhash = (
      await getProvider().connection.getRecentBlockhash()
    ).blockhash;
    return anyTransaction;
  };

  const createTransferTransaction = async (from, to, amount) => {
    return createTransaction(
      SystemProgram.transfer({
        fromPubkey: from,
        toPubkey: from,
        lamports: LAMPORTS_PER_SOLANA * amount,
      })
    );
  };

  const transferSolana = async (from, to, amount) => {
    try {
      console.log(`sending ${amount} from: ${from}, to: ${to}`);

      const { signature } = await getProvider().wallet.signAndSendTransaction(
        await createTransferTransaction(from, to, amount)
      );
      console.log(`Submitted transaction ${signature}, awaiting confirmation`);

      const r = await getProvider().connection.confirmTransaction(signature);
      console.log(`Transaction ${signature} confirmed`);
      return r;
    } catch (err) {
      console.warn(err);
      console.error(`Error: ${JSON.stringify(err)}`);
    }
  };

  const sendTip = async (donateTo) => {
    console.log('Tipping from:', walletAddress.toString());
    console.log('Program PubKey *NOT SENDER*:', baseAccount.publicKey.toString());

    const fromWallet = walletAddress;
    const toWallet = donateTo;
    const amount = 0.001;
    await await transferSolana(fromWallet, toWallet, amount);
  };

  const voteGif = async (item) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.vote(item.gifLink, {
        accounts: {
          baseAccount: baseAccount.publicKey,
        },
      });
      console.log("Voted for gif: ", item.gifLink);
      await getGifList();
    } catch (error) {
      console.log("Error voting for GIF:", error)
    }
  }

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
        </button>
        </div>
      )
    }
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
          </button>
          </form>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
                <p style={{ color: 'white' }}>{'User: ' + item.userAddress.toString()}{' ' + item.votes}</p>
                <button className="cta-button submit-gif-button" onClick={() => voteGif(item)}>
                  VOTE
                </button>
                <p />
                <button className="cta-button submit-gif-button" onClick={() => tipUser(item.userAddress)}>
                  Tip
                </button>
                <p style={{ color: 'white' }}>{'Votes: ' + item.votes}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);

      console.log("Got the account", account)
      setGifList(account.gifList)

    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  // mount hook
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  // mount hook
  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="container">
          <div className="header-container">
            <p className="header">🖼 Zelda & Link GIF Portal</p>
            <p className="sub-text">
              View your Zelda & Link GIF collection in the metaverse ✨
          </p>
            {!walletAddress && renderNotConnectedContainer()}
            {walletAddress && renderConnectedContainer()}
          </div>
          <div className="footer-container">
            <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built on @${TWITTER_HANDLE}`}</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
