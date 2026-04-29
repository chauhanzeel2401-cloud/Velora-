// ─── Stellar Setup ────────────────────────────────────────────────────────────
let connectedPublicKey = null;

// Use a longer timeout — testnet can be slow sometimes
const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org', {
    allowHttp: false,
    timeout: 60000  // 60 seconds instead of default 20s
});
const networkPassphrase = StellarSdk.Networks.TESTNET;

// ─── DOM Elements ─────────────────────────────────────────────────────────────
const connectBtn        = document.getElementById('connectBtn');
const disconnectBtn     = document.getElementById('disconnectBtn');
const walletInfo        = document.getElementById('walletInfo');
const publicKeyEl       = document.getElementById('publicKey');
const balanceSection    = document.getElementById('balanceSection');
const balanceEl         = document.getElementById('balance');
const refreshBtn        = document.getElementById('refreshBtn');
const paymentSection    = document.getElementById('paymentSection');
const paymentForm       = document.getElementById('paymentForm');
const resultSection     = document.getElementById('resultSection');
const resultMessage     = document.getElementById('resultMessage');
const historySection    = document.getElementById('historySection');
const historyList       = document.getElementById('historyList');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');

// ─── Freighter API ────────────────────────────────────────────────────────────
// freighter-api.js is loaded before this file in index.html.
// It exposes window.freighterApi with these methods (v2.x API):
//   isConnected()   → { isConnected: bool }
//   requestAccess() → { address, error }   (opens Freighter popup)
//   getAddress()    → { address, error }
//   signTransaction(xdr, { networkPassphrase }) → { signedTxXdr, error }

// ─── Connect Wallet ───────────────────────────────────────────────────────────
connectBtn.addEventListener('click', async () => {
    connectBtn.textContent = 'Connecting...';
    connectBtn.disabled    = true;

    try {
        // Step 1: Check Freighter extension is installed
        const { isConnected } = await window.freighterApi.isConnected();

        if (!isConnected) {
            showError(
                'Freighter extension not found.<br>' +
                '• Install it from <a href="https://www.freighter.app" target="_blank">freighter.app</a><br>' +
                '• After installing, hard-refresh: <strong>Cmd+Shift+R</strong>'
            );
            return;
        }

        // Step 2: Request access — opens Freighter popup for user to approve
        const accessResult = await window.freighterApi.requestAccess();

        if (accessResult.error) {
            showError('Access denied: ' + accessResult.error.message);
            return;
        }

        // requestAccess returns the address directly on success
        let publicKey = accessResult.address;

        // If address not in requestAccess response, fetch it separately
        if (!publicKey) {
            const addrResult = await window.freighterApi.getAddress();
            if (addrResult.error) {
                showError('Could not get address: ' + addrResult.error.message);
                return;
            }
            publicKey = addrResult.address;
        }

        if (!publicKey) {
            showError(
                'No address returned.<br>' +
                '• Make sure Freighter is <strong>unlocked</strong><br>' +
                '• Set Freighter network to <strong>Testnet</strong>'
            );
            return;
        }

        // Step 3: Update UI
        connectedPublicKey              = publicKey;
        connectBtn.style.display        = 'none';
        disconnectBtn.style.display     = 'inline-block';
        walletInfo.style.display        = 'block';
        publicKeyEl.textContent         = publicKey;
        balanceSection.style.display    = 'block';
        paymentSection.style.display    = 'block';
        historySection.style.display    = 'block';

        await fetchBalance();
        await fetchHistory();
        showSuccess('Wallet connected successfully!');

    } catch (err) {
        console.error('Connect error:', err);
        showError('Failed to connect: ' + (err.message || String(err)));
    } finally {
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.disabled    = false;
    }
});

// ─── Disconnect Wallet ────────────────────────────────────────────────────────
disconnectBtn.addEventListener('click', () => {
    connectedPublicKey              = null;
    connectBtn.style.display        = 'inline-block';
    disconnectBtn.style.display     = 'none';
    walletInfo.style.display        = 'none';
    balanceSection.style.display    = 'none';
    paymentSection.style.display    = 'none';
    resultSection.style.display     = 'none';
    historySection.style.display    = 'none';
    historyList.innerHTML           = '<p class="history-empty">No transactions found.</p>';
    showSuccess('Wallet disconnected.');
});

// ─── Fetch Balance ────────────────────────────────────────────────────────────
async function fetchBalance() {
    if (!connectedPublicKey) return;
    balanceEl.textContent = '⟳ Updating...';

    try {
        // Add cache-busting param so Horizon doesn't return stale data
        const url = `https://horizon-testnet.stellar.org/accounts/${connectedPublicKey}?_=${Date.now()}`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                balanceEl.textContent = '0 XLM (unfunded)';
                showError('Account not funded. Get free XLM at <a href="https://laboratory.stellar.org/#account-creator" target="_blank">Stellar Friendbot</a>.');
                return;
            }
            throw new Error('HTTP ' + response.status);
        }

        const data     = await response.json();
        const nativeItem = data.balances.find(b => b.asset_type === 'native');
        const bal = nativeItem ? parseFloat(nativeItem.balance).toFixed(2) : '0.00';
        balanceEl.textContent = `${bal} XLM`;

    } catch (err) {
        console.error('Balance error:', err);
        showError('Could not fetch balance: ' + err.message);
    }
}

refreshBtn.addEventListener('click', fetchBalance);

// ─── Transaction History ──────────────────────────────────────────────────────
refreshHistoryBtn.addEventListener('click', fetchHistory);

async function fetchHistory() {
    if (!connectedPublicKey) return;

    historyList.innerHTML = '<p class="history-loading">⟳ Loading transactions...</p>';

    try {
        const url = `https://horizon-testnet.stellar.org/accounts/${connectedPublicKey}/payments?order=desc&limit=20&_=${Date.now()}`;
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 404) {
                historyList.innerHTML = '<p class="history-empty">Account not funded yet — no transactions.</p>';
                return;
            }
            throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();
        const records = data._embedded && data._embedded.records;

        if (!records || records.length === 0) {
            historyList.innerHTML = '<p class="history-empty">No transactions found.</p>';
            return;
        }

        historyList.innerHTML = '';

        for (const tx of records) {
            // Only handle payment operations
            if (tx.type !== 'payment' && tx.type !== 'create_account') continue;

            const isSent     = tx.from === connectedPublicKey;
            const isReceived = tx.to === connectedPublicKey || tx.account === connectedPublicKey;
            const direction  = isSent ? 'sent' : 'received';
            const label      = isSent ? '↑ Sent' : '↓ Received';

            const counterparty = isSent
                ? (tx.to || 'unknown')
                : (tx.from || tx.funder || 'unknown');

            const amount = tx.amount
                ? parseFloat(tx.amount).toFixed(2) + ' XLM'
                : tx.starting_balance
                    ? parseFloat(tx.starting_balance).toFixed(2) + ' XLM'
                    : '— XLM';

            const date = tx.created_at
                ? new Date(tx.created_at).toLocaleString()
                : 'Unknown date';

            const shortAddr = counterparty.length > 12
                ? counterparty.substring(0, 6) + '...' + counterparty.slice(-6)
                : counterparty;

            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-item-header">
                    <span class="history-type ${direction}">${label}</span>
                    <span class="history-amount">${amount}</span>
                </div>
                <div class="history-details">
                    ${isSent ? 'To' : 'From'}:
                    <span class="history-address" title="${counterparty}">${shortAddr}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
                    <span class="history-date">🕐 ${date}</span>
                    <a class="history-link"
                       href="https://stellar.expert/explorer/testnet/tx/${tx.transaction_hash}"
                       target="_blank">View →</a>
                </div>
            `;
            historyList.appendChild(item);
        }

        if (historyList.children.length === 0) {
            historyList.innerHTML = '<p class="history-empty">No payment transactions found.</p>';
        }

    } catch (err) {
        console.error('History error:', err);
        historyList.innerHTML = `<p class="history-empty">Could not load history: ${err.message}</p>`;
    }
}

// ─── Send Payment ─────────────────────────────────────────────────────────────
paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const recipient = document.getElementById('recipient').value.trim();
    const amount    = document.getElementById('amount').value.trim();

    if (!connectedPublicKey)                { showError('Please connect your wallet first.'); return; }
    if (!recipient)                         { showError('Please enter a recipient address.'); return; }
    if (!amount || parseFloat(amount) <= 0) { showError('Please enter a valid amount.'); return; }

    const sendBtn       = paymentForm.querySelector('button[type="submit"]');
    sendBtn.textContent = 'Sending...';
    sendBtn.disabled    = true;

    try {
        await sendPayment(recipient, amount);
    } catch (err) {
        console.error('Payment error:', err);
        showError('Payment failed: ' + (err.message || String(err)));
    } finally {
        sendBtn.textContent = 'Send Payment';
        sendBtn.disabled    = false;
    }
});

async function sendPayment(destination, amount) {
    // Build the transaction
    const sourceAccount = await server.loadAccount(connectedPublicKey);
    const transaction   = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase
    })
    .addOperation(
        StellarSdk.Operation.payment({
            destination,
            asset:  StellarSdk.Asset.native(),
            amount: amount.toString()
        })
    )
    .setTimeout(60) // 60s to match server timeout
    .build();

    // Sign with Freighter — opens popup for user to approve
    const signResult = await window.freighterApi.signTransaction(
        transaction.toXDR(),
        { networkPassphrase }
    );

    if (signResult.error) {
        throw new Error(signResult.error.message || String(signResult.error));
    }

    // Submit signed transaction — retry up to 3 times on 504
    const txToSubmit = StellarSdk.TransactionBuilder.fromXDR(
        signResult.signedTxXdr,
        networkPassphrase
    );

    let result;
    let attempts = 0;
    while (attempts < 3) {
        try {
            result = await server.submitTransaction(txToSubmit);
            break; // success — exit loop
        } catch (err) {
            attempts++;
            const status = err.response && err.response.status;

            // 504 = gateway timeout, worth retrying
            if (status === 504 && attempts < 3) {
                showError(`Testnet is slow, retrying... (attempt ${attempts}/3)`);
                await new Promise(r => setTimeout(r, 3000)); // wait 3s before retry
                continue;
            }

            // Any other error — extract Stellar's error detail if available
            const stellarError = err.response && err.response.data &&
                                 err.response.data.extras &&
                                 err.response.data.extras.result_codes;
            if (stellarError) {
                throw new Error(JSON.stringify(stellarError));
            }
            throw err;
        }
    }

    showSuccess(`${amount} XLM sent to ${destination.substring(0, 8)}...`, result.hash);

    document.getElementById('recipient').value = '';
    document.getElementById('amount').value    = '';

    // Testnet ledger closes every ~5s, refresh at 5s, 10s, 20s to catch the update
    setTimeout(fetchBalance, 5000);
    setTimeout(fetchBalance, 10000);
    setTimeout(fetchBalance, 20000);

    // Refresh history after ledger closes
    setTimeout(fetchHistory, 6000);
    setTimeout(fetchHistory, 12000);
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function showSuccess(message, txHash = null) {
    resultSection.style.display = 'block';
    resultMessage.className     = 'success';

    let html = `<strong>✓ Success!</strong><br>${message}`;
    if (txHash) {
        html += `<div class="tx-hash">
            <strong>Transaction Hash:</strong><br>${txHash}<br>
            <a href="https://stellar.expert/explorer/testnet/tx/${txHash}"
               target="_blank" class="tx-link">View on Stellar Expert →</a>
        </div>`;
    }
    resultMessage.innerHTML = html;

    setTimeout(() => {
        if (resultMessage.className === 'success') resultSection.style.display = 'none';
    }, 12000);
}

function showError(message) {
    resultSection.style.display = 'block';
    resultMessage.className     = 'error';
    resultMessage.innerHTML     = `<strong>✗ Error!</strong><br>${message}`;

    setTimeout(() => {
        if (resultMessage.className === 'error') resultSection.style.display = 'none';
    }, 10000);
}
