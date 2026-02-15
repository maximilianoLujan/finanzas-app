const cryptoMap: Record<string, string> = {
  BTC: "btc-bitcoin",
  ETH: "eth-ethereum",
  ADA: "ada-cardano",
  BNB: "bnb-binance-coin",
  SOL: "sol-solana"
};

const DOLAR_HARDCODE = 1500

export async function getAssetPrice(symbol: string, type: string, dolar: number | null,currency: string,quantity: number) {
  try {

    // ---------- CASH ARS----------
    if (type === "cash" && currency === 'ARS') return quantity;
    // ---------- CASH USD----------
    if (type === "cash" && currency === 'USD' && dolar) return quantity * dolar;
    if (type === "cash" && currency === 'USD' && !dolar) return quantity * DOLAR_HARDCODE;


    // ---------- CRYPTO ----------
    if (type === "crypto") {
      const id = cryptoMap[symbol.toUpperCase()];
      if (!id) return null;

      const res = await fetch(
        `https://api.coinpaprika.com/v1/tickers/${id}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data?.quotes?.USD?.price){
        if(dolar){
          return (data?.quotes?.USD?.price * quantity) * dolar
        } else {
          return (data?.quotes?.USD?.price * quantity) * DOLAR_HARDCODE
        }
      } else {
        return null
      }
    }


    // ---------- STOCK ----------
    if (type === "stock") {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.NEXT_PUBLIC_ALPHAVANTAGE_API_KEY}`
      );

      const data = await res.json();
      console.log(data.c)
      return data.c ?? null;
    }

    return null;

  } catch (err) {
    console.error("price error", err);
    return null;
  }
}
