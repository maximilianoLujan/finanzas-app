'use client';

import { useEffect, useState } from 'react';
import { supabase } from './services/supabase';
import { FaLandmark, FaMoneyBillWave, FaPiggyBank, FaPlus, FaCreditCard, FaEllipsisH, FaArrowLeft,FaArrowRight } from 'react-icons/fa';
import { getAssetPrice } from './services/api/getPriceCoin';

interface Wallet {
  id: string;
  name: string;
  balance: number;
  currency: string;
  color: string;
  type: string;
}



export default function Home() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [usdRate, setUsdRate] = useState<number | null>(null);
  const [totalBalance,setTotalBalance] = useState<number>(0);
  const [errors,setErrors] = useState<string[]>([])

  useEffect(() => {
    async function fetchDollar() {
      const res = await fetch("https://dolarapi.com/v1/dolares/oficial");
      const data = await res.json();
      setUsdRate(data.venta);
    }

    fetchDollar();
  }, []);

  useEffect(() => {
    if(!usdRate) return;
    async function fetchWallets() {
      try {
        const { data, error } = await supabase
          .from("wallets")
          .select(`
          *,
          assets (*)
        `)
          .limit(3);

        if (error) throw error;

        let totalPortfolio = 0;

        if (data && data.length > 0) {

          const dataWallet = await Promise.all(
            data.map(async (wallet) => {

              const assets = wallet.assets;
              let balanceWallet = 0

              for (const asset of assets) {
                const actualPrice = await getAssetPrice(asset.symbol, asset.type, usdRate, asset.currency, asset.quantity);
                console.log(asset.symbol, actualPrice);

                if (actualPrice) {
                  totalPortfolio += actualPrice;
                  balanceWallet += actualPrice
                }else{
                  setErrors(prev => [
                    ...prev,
                    `No se pudo obtener precio de ${asset.symbol} (${asset.type})`
                  ]);
                }
              }

              return {
                ...wallet,
                balance: balanceWallet
              };
            })
          );

          setWallets(dataWallet);
        }

        setTotalBalance(totalPortfolio);

      } catch (err) {
        console.error("Error fetching wallets:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchWallets();
  }, [usdRate]);


  return (
    <main className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      {/* Header */}
      <header className="p-6 pt-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Mis Finanzas</h1>
            <p className="text-gray-500 text-sm">Hola, Maxi 👋</p>
          </div>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-xl mb-8">
          <p className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-medium">Balance Total Est.</p>
          <div className="flex items-end gap-2 mb-6">
            <h2 className="text-3xl font-bold">$ {totalBalance.toLocaleString('es-AR')}</h2>
          </div>
        </div>
      </header>

      {/* Wallets Section */}
      <section className="px-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Mis Wallets</h3>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            wallets.map((wallet) => (
              <div key={wallet.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-[0.98] transition-transform">
                <div className={'rounded-xl'}>
                  <FaLandmark />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{wallet.name}</h4>
                  <p className="text-xs text-gray-400">{wallet.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    $ {Math.floor(wallet?.balance ?? 0).toLocaleString('es-AR')}
                  </p>

                  <p className="text-[10px] text-gray-400 font-medium uppercase">{wallet?.currency}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
      </section>
      {/* Errors */}
      {errors.length > 0 && (
        <div className="px-6 mt-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm animate-fade-in">

            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <h4 className="font-semibold text-red-700 text-sm">
                Algunos precios no pudieron cargarse
              </h4>
            </div>

            <ul className="space-y-1 text-sm text-red-600">
              {errors.map((err, i) => (
                <li key={i} className="flex gap-2">
                  <span>•</span>
                  <span>{err}</span>
                </li>
              ))}
            </ul>

          </div>
        </div>
      )}
    </main>
  );
}