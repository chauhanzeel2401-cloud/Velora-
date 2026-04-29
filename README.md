# 💫 Velora

🌐 **Live App**: [https://velora-stellar-testnet-payment-app.netlify.app](https://velora-stellar-testnet-payment-app.netlify.app)

A simple, beginner-friendly payment dApp built on the Stellar testnet. Velora allows users to connect their Freighter Wallet, view their XLM balance, and send payments to other Stellar addresses.

## 📋 Description

Velora is a basic decentralized application (dApp) that demonstrates core blockchain functionality:
- Wallet connection using Freighter
- Balance checking on Stellar testnet
- Sending XLM tokens to other addresses
- Transaction confirmation and tracking

This project is designed for beginners learning blockchain development and meets the Level 1 (White Belt) requirements of the Stellar builder challenge.

## 🚀 Features

- **Wallet Integration**: Connect and disconnect Freighter Wallet
- **Balance Display**: View your XLM balance in real-time
- **Send Payments**: Transfer XLM to any Stellar address
- **Transaction Tracking**: View transaction hashes and links to block explorer
- **Error Handling**: Clear error messages for common issues
- **Simple UI**: Clean, intuitive interface

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla JS - no frameworks)
- **Blockchain**: Stellar SDK (v11.2.2)
- **Wallet**: Freighter Wallet API
- **Network**: Stellar Testnet

## 📦 Prerequisites

Before running this project, make sure you have:

1. **Freighter Wallet** installed in your browser
   - Download from: https://www.freighter.app/
   
2. **Testnet Account** funded with XLM
   - Create and fund account at: https://laboratory.stellar.org/#account-creator
   
3. **Web Browser** (Chrome, Firefox, or Brave recommended)

4. **Local Web Server** (optional but recommended)
   - Python, Node.js http-server, or VS Code Live Server

## 🏃 How to Run Locally

### Step 1: Install dependencies

```bash
npm run setup
```

This does two things:
1. Installs `@stellar/freighter-api` from npm
2. Copies the browser bundle to `freighter-api.js` (local file, no CDN needed)

### Step 2: Start a local server

```bash
# Python 3
python3 -m http.server 8000

# OR Node.js
npx serve . -p 8000
```

### Step 3: Open in browser

```
http://localhost:8000
```

> **Why npm?** The Freighter API is not reliably available on public CDNs. Installing it locally via npm guarantees it always loads.

## 📖 How to Use

### Step 1: Connect Your Wallet
1. Click the "Connect Wallet" button
2. Freighter popup will appear - approve the connection
3. Your public key will be displayed

### Step 2: View Your Balance
1. Once connected, your XLM balance will automatically load
2. Click "Refresh Balance" to update at any time

### Step 3: Send a Payment
1. Enter the recipient's Stellar address (starts with G...)
2. Enter the amount of XLM to send
3. Click "Send Payment"
4. Approve the transaction in Freighter popup
5. Wait for confirmation - you'll see a success message with transaction hash

### Step 4: Verify Transaction
1. Click the "View on Stellar Expert" link in the success message
2. See your transaction details on the block explorer

## 📸 Screenshots

### 1. Initial Screen
![Initial Screen](screenshots/initial.png)
*The landing page with "Connect Wallet" button*

### 2. Wallet Connected
![Wallet Connected](screenshots/connected.png)
*After connecting Freighter, showing public key and balance*

### 3. Sending Payment
![Send Payment](screenshots/send-payment.png)
*Payment form with recipient address and amount*

### 4. Successful Transaction
![Transaction Success](screenshots/success.png)
*Success message with transaction hash and explorer link*

## 🔧 Project Structure

```
Velora/
│
├── index.html          # Main HTML structure
├── style.css           # Styling and layout
├── app.js              # JavaScript logic and Stellar integration
├── README.md           # This file
└── screenshots/        # Screenshots folder (create this)
```

## ⚠️ Important Notes

- **Testnet Only**: This app uses Stellar testnet. Testnet XLM has no real value.
- **Fund Your Account**: Get free testnet XLM at https://laboratory.stellar.org/#account-creator
- **Freighter Required**: You must have Freighter Wallet installed to use this app
- **Browser Compatibility**: Works best on Chrome, Firefox, and Brave browsers

## 🐛 Common Issues & Solutions

### "Freighter Wallet is not installed"
- Install Freighter from https://www.freighter.app/
- Refresh the page after installation

### "Account not found"
- Your account needs to be funded with at least 1 XLM
- Visit https://laboratory.stellar.org/#account-creator to fund your testnet account

### "Failed to connect wallet"
- Make sure Freighter is unlocked
- Try refreshing the page
- Check if you're on the correct network (testnet)

### "Payment failed"
- Verify the recipient address is valid (starts with G)
- Ensure you have enough XLM (plus fees)
- Check your internet connection

## 🎓 Learning Resources

- **Stellar Documentation**: https://developers.stellar.org/
- **Freighter Docs**: https://docs.freighter.app/
- **Stellar Laboratory**: https://laboratory.stellar.org/
- **Stellar Expert Explorer**: https://stellar.expert/explorer/testnet

## 📝 Code Explanation

### Key Functions:

- `connectBtn.addEventListener()`: Connects to Freighter and gets public key
- `fetchBalance()`: Loads account data and displays XLM balance
- `sendPayment()`: Builds, signs, and submits transaction to Stellar network
- `showSuccess()` / `showError()`: Display user-friendly messages

### Stellar SDK Usage:

```javascript
// Connect to testnet
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

// Build transaction
const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {...})
    .addOperation(StellarSdk.Operation.payment({...}))
    .build();

// Sign with Freighter
const signedTransaction = await window.freighterApi.signTransaction(transactionXDR);

// Submit to network
const result = await server.submitTransaction(transactionToSubmit);
```

## 🌟 Future Enhancements

Possible improvements for learning:
- Add transaction history
- Support for custom tokens
- Multiple recipient payments
- QR code scanning for addresses
- Transaction memo support

## 📄 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Feel free to fork this project and make improvements! This is a learning project, so contributions that maintain simplicity are welcome.

## 📧 Support

If you encounter issues:
1. Check the "Common Issues" section above
2. Review the Stellar documentation
3. Verify your testnet account is funded

---

**Built with ❤️ for the Stellar community**

*This is a testnet application for learning purposes only. Never use testnet credentials on mainnet!*
