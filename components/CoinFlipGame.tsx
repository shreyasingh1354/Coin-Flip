"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { CoinFlipABI } from "../contracts/CoinFlipABI";
import "./CoinFlipGame.css"; 

const CoinFlipGame: React.FC = () => {
  const [web3Modal, setWeb3Modal] = useState<Web3Modal | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string>("");
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [betAmount, setBetAmount] = useState<string>("");
  const [betSide, setBetSide] = useState<boolean>(true);
  const [result, setResult] = useState<string | null>(null);
  const [betResult, setBetResult] = useState<{ won: boolean; winnings: string } | null>(null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);

  useEffect(() => {
    const newWeb3Modal = new Web3Modal({
      network: "localhost", 
      cacheProvider: true,
    });
    setWeb3Modal(newWeb3Modal);
  }, []);

  const connectWallet = async () => {
    if (!web3Modal) return;
    try {
      const instance = await web3Modal.connect();
      const ethersProvider = new ethers.BrowserProvider(instance);
      const signer = await ethersProvider.getSigner();
      const userAddress = await signer.getAddress();

      setProvider(ethersProvider);
      setSigner(signer);
      setAddress(userAddress);

      const contractAddress = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6"; // Replace with your deployed contract address
      const contract = new ethers.Contract(contractAddress, CoinFlipABI, signer);
      setContract(contract);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleReceipt = (receipt: any) => {
    try {
      const events = receipt.logs
        .map((log: any) => {
          try {
            return contract?.interface.parseLog(log);
          } catch (e) {
            console.log("Failed to parse log:", log);
            return null;
          }
        })
        .filter(Boolean);

    

      const coinFlippedEvent = events.find((event: any) => event.name === "CoinFlipped");

      if (coinFlippedEvent) {
        const [user, amount, side, result, winnings] = coinFlippedEvent.args;
        const won = result;

        let newBetAmount = parseFloat(betAmount);
        if (won) {
          // Double the bet amount on win
          newBetAmount *= 2;
        } else {
          // Lose the entire bet amount on loss
          newBetAmount = 0;
        }

        setBetAmount(String(newBetAmount));
        setBetResult({ won, winnings: ethers.formatEther(winnings) });
        setResult(won ? `You won ${newBetAmount} ETH!` : "You lost. Better luck next time!");
      } else {
        
        setResult("Bet placed, but couldn't determine the result. Check your wallet for changes.");
      }
    } catch (error) {
      console.error("Error handling receipt:", error);
      setResult("Failed to parse transaction receipt.");
    }
  };

  const placeBet = async () => {
    if (!contract || !signer) {
      console.error("Contract or signer not initialized");
      setResult("Contract or signer not initialized.");
      return;
    }

    try {
      setResult("Placing bet...");
      setBetResult(null);
      setIsFlipping(true);

      console.log("Bet details:", { betSide, betAmount });

      const tx = await contract.placeBet(betSide, {
        value: ethers.parseEther(betAmount),
        gasLimit: 300000,
      });

      console.log("Transaction sent:", tx.hash);
      setResult(`Transaction Hash: ${tx.hash}`);

      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      if (receipt.status === 1) {
        console.log("Transaction successful");
        handleReceipt(receipt);
      } else {
        console.log("Transaction failed");
        setResult("Transaction failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Error placing bet:", error);
      setResult(`Failed to place bet: ${error.message}`);
    } finally {
      setIsFlipping(false);
    }
  };

  const getCoinFaceStyle = () => {
    return {
      backgroundImage: `url(${betSide ? "/coin/heads.jpeg" : "/coin/tails.jpeg"})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      width: '200px', 
      height: '200px',
      borderRadius: '50%', 
      boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.3)', 
    };
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">

      <div className="p-12 bg-gray-800 bg-opacity-80 rounded-lg shadow-lg text-white space-y-4 w-full max-w-lg">
        {!address ? (
          <button
            onClick={connectWallet}
            className="w-full px-4 py-2 font-bold text-white bg-green-600 hover:bg-limeade-dark rounded transition duration-300 ease-in-out"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="space-y-4">
            <p
              className="text-lg font-semibold text-address animate-pulse"
              style={{ color: '#34C759' }}
            >
              Connected: {address}
            </p>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="Bet amount in ETH"
              className="w-full px-3 py-2 border rounded bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
            />
            <select
              value={betSide.toString()}
              onChange={(e) => setBetSide(e.target.value === "true")}
              className="w-full px-3 py-2 border rounded bg-gray-700 border-gray-600 text-white"
            >
              <option value="true">Heads</option>
              <option value="false">Tails</option>
            </select>
            <div className="flex items-center justify-center">
              <div
                className={`coin ${isFlipping ? "flip" : ""}`}
                style={getCoinFaceStyle()}
              >
                <div className="face heads"></div>
                <div className="face tails"></div>
              </div>
            </div>
            <button
              onClick={placeBet}
              className="w-full px-4 py-2 font-bold text-white bg-limeade hover:bg-limeade-dark rounded transition duration-300 ease-in-out"
              disabled={isFlipping}
            >
              {isFlipping ? "Flipping..." : "Place Bet"}
            </button>
            {result && (
              <p
                className="text-center text-lg animate-fade-in"
                style={{ color: '#34C759' }}
              >
                {result}
              </p>
            )}
            {betResult && (
              <div className="text-center mt-4">
                <p
                  className={`text-xl font-bold animate-bounce ${
                    betResult.won ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {betResult.won ? "You Won!" : "You Lost"}
                </p>
                {betResult.won && (
                  <p
                    className="text-lg animate-fade-in"
                    style={{ color: '#34C759' }}
                  >
                    Winnings: {betResult.winnings} ETH
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
  };
  
  export default CoinFlipGame;
  