import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

function Account() {
  const [exchangeAccounts, setExchangeAccounts] = useState([]);
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({});
  const [newAccount, setNewAccount] = useState({
    exchange_name: 'binance',
    account_name: '',
    api_key: '',
    api_secret: '',
    api_passphrase: '',
    is_testnet: false,
  });

  useEffect(() => {
    fetchExchangeAccounts();
  }, []);

  const fetchExchangeAccounts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/exchange-accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const accounts = await response.json();
        setExchangeAccounts(accounts);
      }
    } catch (error) {
      console.error('Error fetching exchange accounts:', error);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/exchange-accounts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAccount),
      });

      if (response.ok) {
        await fetchExchangeAccounts();
        setShowNewAccountForm(false);
        setNewAccount({
          exchange_name: 'binance',
          account_name: '',
          api_key: '',
          api_secret: '',
          api_passphrase: '',
          is_testnet: false,
        });
      } else {
        console.error('Failed to create exchange account');
      }
    } catch (error) {
      console.error('Error creating exchange account:', error);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (window.confirm('Are you sure you want to delete this exchange account?')) {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`/api/exchange-accounts/${accountId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          await fetchExchangeAccounts();
        }
      } catch (error) {
        console.error('Error deleting exchange account:', error);
      }
    }
  };

  const toggleApiKeyVisibility = (accountId) => {
    setShowApiKeys(prev => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-100">Account Settings</h1>
          <p className="text-neutral-400 mt-1">Manage your exchange connections and API keys</p>
        </div>
        <button
          onClick={() => setShowNewAccountForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Exchange
        </button>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Security Information</h3>
            <p className="text-sm text-blue-700 mt-1">
              Your API keys are encrypted and stored securely. We recommend using read-only or trade-only permissions 
              and never sharing keys that have withdrawal permissions.
            </p>
          </div>
        </div>
      </div>

      {/* New Account Form */}
      {showNewAccountForm && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Add New Exchange Account</h3>
          
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exchange
                </label>
                <select
                  value={newAccount.exchange_name}
                  onChange={(e) => setNewAccount({...newAccount, exchange_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="binance">Binance</option>
                  <option value="mexc">MEXC</option>
                  <option value="hyperliquid">HyperLiquid</option>
                  <option value="coinbase">Coinbase</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={newAccount.account_name}
                  onChange={(e) => setNewAccount({...newAccount, account_name: e.target.value})}
                  placeholder="e.g., Main Trading Account"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="text"
                value={newAccount.api_key}
                onChange={(e) => setNewAccount({...newAccount, api_key: e.target.value})}
                placeholder="Enter your API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Secret
              </label>
              <input
                type="password"
                value={newAccount.api_secret}
                onChange={(e) => setNewAccount({...newAccount, api_secret: e.target.value})}
                placeholder="Enter your API secret"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {newAccount.exchange_name === 'coinbase' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Passphrase
                </label>
                <input
                  type="password"
                  value={newAccount.api_passphrase}
                  onChange={(e) => setNewAccount({...newAccount, api_passphrase: e.target.value})}
                  placeholder="Enter your API passphrase"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="testnet"
                checked={newAccount.is_testnet}
                onChange={(e) => setNewAccount({...newAccount, is_testnet: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="testnet" className="text-sm text-gray-700">
                This is a testnet account
              </label>
            </div>

            <div className="flex space-x-4">
              <button type="submit" className="btn-primary">
                Add Account
              </button>
              <button
                type="button"
                onClick={() => setShowNewAccountForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exchange Accounts List */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Connected Exchanges</h3>
        
        {exchangeAccounts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No exchange accounts connected yet</p>
            <p className="text-sm">Add an exchange account to start trading</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exchangeAccounts.map((account) => (
              <div key={account.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-primary-600 font-semibold text-lg">
                        {account.exchange_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{account.account_name}</h4>
                      <p className="text-sm text-gray-600 capitalize">
                        {account.exchange_name} {account.is_testnet && '(Testnet)'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      account.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </span>
                    
                    <button
                      onClick={() => toggleApiKeyVisibility(account.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKeys[account.id] ? (
                        <EyeSlashIcon className="w-4 h-4" />
                      ) : (
                        <EyeIcon className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="p-2 text-red-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {showApiKeys[account.id] && (
                  <div className="mt-4 p-3 bg-gray-50 rounded border">
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">API Key:</span>
                        <p className="font-mono text-sm break-all">{account.api_key}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        API Secret: ••••••••••••••••
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-3 text-xs text-gray-500">
                  Added on {new Date(account.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Account;