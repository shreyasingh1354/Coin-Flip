import type { NextPage } from 'next';
import CoinFlipGame from '../../components/CoinFlipGame'
import './globals.css'


const CoinFlipPage: NextPage = () => {
  return (
    <div>
      <h1 className="text-5xl font-bold bg-black text-center my-8">Coin Flip Game</h1>
      <CoinFlipGame />
    </div>
  );
};

export default CoinFlipPage;