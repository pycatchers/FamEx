import React, { useState } from 'react';
import { 
  Camera, 
  MapPin, 
  ShoppingBag, 
  TrendingUp, 
  Plus, 
  Search, 
  Calendar, 
  Receipt, 
  BarChart3, 
  Store, 
  Clock, 
  Star,
  ArrowRight,
  Filter,
  Edit3,
  Trash2
} from 'lucide-react';

const ShoppingAnalyticsApp = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [activeScreen, setActiveScreen] = useState('home');

  // Mock data
  const recentShops = [
    { id: 1, name: 'SuperMart', address: '123 Main St', lastVisit: '2 days ago', items: 5 },
    { id: 2, name: 'Fresh Grocers', address: '456 Oak Ave', lastVisit: '5 days ago', items: 3 },
    { id: 3, name: 'Quick Stop', address: '789 Pine Rd', lastVisit: '1 week ago', items: 8 }
  ];

  const frequentItems = [
    { id: 1, name: 'Milk', frequency: 12, avgPrice: 45, shops: 3 },
    { id: 2, name: 'Bread', frequency: 8, avgPrice: 25, shops: 2 },
    { id: 3, name: 'Rice', frequency: 6, avgPrice: 120, shops: 4 }
  ];

  const allShops = [
    { id: 1, name: 'SuperMart', address: '123 Main St', totalItems: 45, avgSavings: 15 },
    { id: 2, name: 'Fresh Grocers', address: '456 Oak Ave', totalItems: 23, avgSavings: 8 },
    { id: 3, name: 'Quick Stop', address: '789 Pine Rd', totalItems: 67, avgSavings: 22 },
    { id: 4, name: 'Local Market', address: '321 Elm St', totalItems: 12, avgSavings: 5 }
  ];

  const shopItems = [
    { id: 1, name: 'Milk', mrp: 50, discount: 5, paidPrice: 45, date: '2024-01-15' },
    { id: 2, name: 'Bread', mrp: 30, discount: 5, paidPrice: 25, date: '2024-01-15' },
    { id: 3, name: 'Rice 5kg', mrp: 150, discount: 30, paidPrice: 120, date: '2024-01-10' }
  ];

  // Header Component
  const Header = ({ title, showBack = false, onBack, actions }) => (
    <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={onBack} className="p-1">
            ←
          </button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );

  // Home Screen
  const HomeScreen = () => (
    <div className="bg-gray-50 min-h-screen">
      <Header title="Shopping Analytics" />
      
      {/* Quick Actions */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveScreen('addReceipt')}
              className="flex-1 bg-blue-500 text-white p-4 rounded-lg flex flex-col items-center gap-2"
            >
              <Camera size={24} />
              <span className="text-sm">Scan Receipt</span>
            </button>
            <button 
              onClick={() => setActiveScreen('addManual')}
              className="flex-1 bg-green-500 text-white p-4 rounded-lg flex flex-col items-center gap-2"
            >
              <Edit3 size={24} />
              <span className="text-sm">Add Manual</span>
            </button>
          </div>
        </div>

        {/* Recently Visited Shops */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recently Visited</h2>
            <button 
              onClick={() => setActiveScreen('shops')}
              className="text-blue-500 text-sm"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentShops.map(shop => (
              <div 
                key={shop.id} 
                onClick={() => setActiveScreen('shopDetails')}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Store size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{shop.name}</h3>
                    <p className="text-sm text-gray-500">{shop.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{shop.lastVisit}</p>
                  <p className="text-xs text-gray-400">{shop.items} items</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Frequently Bought Items */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Frequently Bought</h2>
          <div className="space-y-3">
            {frequentItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500">Bought {item.frequency} times</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{item.avgPrice}</p>
                  <p className="text-xs text-gray-400">{item.shops} shops</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Shops List Screen
  const ShopsScreen = () => (
    <div className="bg-gray-50 min-h-screen">
      <Header 
        title="All Shops" 
        showBack 
        onBack={() => setActiveScreen('home')}
        actions={[
          <button key="search" className="p-2">
            <Search size={20} />
          </button>
        ]}
      />
      
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button className="flex-1 bg-white p-3 rounded-lg flex items-center justify-center gap-2">
            <Filter size={16} />
            <span>Filter</span>
          </button>
          <button className="flex-1 bg-white p-3 rounded-lg flex items-center justify-center gap-2">
            <MapPin size={16} />
            <span>Near Me</span>
          </button>
        </div>

        <div className="space-y-3">
          {allShops.map(shop => (
            <div 
              key={shop.id} 
              onClick={() => setActiveScreen('shopDetails')}
              className="bg-white p-4 rounded-lg shadow-sm cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{shop.name}</h3>
                <ArrowRight size={16} className="text-gray-400" />
              </div>
              <p className="text-gray-600 text-sm mb-3">{shop.address}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{shop.totalItems} items purchased</span>
                <span className="text-green-600 font-medium">₹{shop.avgSavings} avg savings</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Shop Details Screen
  const ShopDetailsScreen = () => (
    <div className="bg-gray-50 min-h-screen">
      <Header 
        title="SuperMart" 
        showBack 
        onBack={() => setActiveScreen('shops')}
        actions={[
          <button key="analytics" className="p-2">
            <BarChart3 size={20} />
          </button>
        ]}
      />
      
      <div className="p-4">
        {/* Shop Info */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={16} className="text-gray-500" />
            <span className="text-gray-600">123 Main St, Downtown</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">45</p>
              <p className="text-xs text-gray-500">Total Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">₹675</p>
              <p className="text-xs text-gray-500">Total Savings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">12</p>
              <p className="text-xs text-gray-500">Visits</p>
            </div>
          </div>
        </div>

        {/* Monthly Filter */}
        <div className="flex gap-2 mb-4">
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">Jan 2024</button>
          <button className="bg-white px-4 py-2 rounded-lg text-sm">Dec 2023</button>
          <button className="bg-white px-4 py-2 rounded-lg text-sm">Nov 2023</button>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-4">Items Purchased</h3>
          <div className="space-y-3">
            {shopItems.map(item => (
              <div key={item.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{item.paidPrice}</p>
                    {item.discount > 0 && (
                      <p className="text-xs text-green-600">₹{item.discount} saved</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>MRP: ₹{item.mrp}</span>
                  <span>Discount: {((item.discount / item.mrp) * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Add Receipt Screen
  const AddReceiptScreen = () => (
    <div className="bg-gray-50 min-h-screen">
      <Header 
        title="Scan Receipt" 
        showBack 
        onBack={() => setActiveScreen('home')}
      />
      
      <div className="p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm text-center mb-4">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera size={40} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Scan Your Receipt</h2>
          <p className="text-gray-600 mb-6">Take a photo of your receipt to automatically extract item details</p>
          <button className="w-full bg-blue-500 text-white p-4 rounded-lg font-medium">
            Open Camera
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-3">Tips for better scanning:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Ensure good lighting</li>
            <li>• Keep the receipt flat</li>
            <li>• Include the entire receipt in frame</li>
            <li>• Avoid shadows and glare</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Add Manual Screen
  const AddManualScreen = () => (
    <div className="bg-gray-50 min-h-screen">
      <Header 
        title="Add Purchase" 
        showBack 
        onBack={() => setActiveScreen('home')}
      />
      
      <div className="p-4 space-y-4">
        {/* Shop Selection */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Shop</label>
          <button className="w-full p-3 border border-gray-300 rounded-lg text-left flex items-center justify-between">
            <span className="text-gray-500">Select or add shop</span>
            <Plus size={16} />
          </button>
        </div>

        {/* Item Details */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-semibold mb-4">Item Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
              <input 
                type="text" 
                placeholder="Enter item name"
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MRP</label>
                <input 
                  type="number" 
                  placeholder="₹0"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paid Price</label>
                <input 
                  type="number" 
                  placeholder="₹0"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input 
                type="date" 
                className="w-full p-3 border border-gray-300 rounded-lg"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-gray-200 text-gray-700 p-4 rounded-lg font-medium">
            Add Another
          </button>
          <button className="flex-1 bg-blue-500 text-white p-4 rounded-lg font-medium">
            Save Purchase
          </button>
        </div>
      </div>
    </div>
  );

  // Bottom Navigation
  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around">
        <button 
          onClick={() => setActiveScreen('home')}
          className={`flex flex-col items-center gap-1 p-2 ${activeScreen === 'home' ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <ShoppingBag size={20} />
          <span className="text-xs">Home</span>
        </button>
        <button 
          onClick={() => setActiveScreen('shops')}
          className={`flex flex-col items-center gap-1 p-2 ${activeScreen === 'shops' ? 'text-blue-500' : 'text-gray-500'}`}
        >
          <Store size={20} />
          <span className="text-xs">Shops</span>
        </button>
        <button 
          onClick={() => setActiveScreen('addReceipt')}
          className="flex flex-col items-center gap-1 p-2 bg-blue-500 text-white rounded-full -mt-3"
        >
          <Plus size={24} />
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-gray-500">
          <TrendingUp size={20} />
          <span className="text-xs">Analytics</span>
        </button>
        <button className="flex flex-col items-center gap-1 p-2 text-gray-500">
          <Receipt size={20} />
          <span className="text-xs">History</span>
        </button>
      </div>
    </div>
  );

  // Screen Router
  const renderScreen = () => {
    switch (activeScreen) {
      case 'home': return <HomeScreen />;
      case 'shops': return <ShopsScreen />;
      case 'shopDetails': return <ShopDetailsScreen />;
      case 'addReceipt': return <AddReceiptScreen />;
      case 'addManual': return <AddManualScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <div className="max-w-sm mx-auto bg-white relative pb-20">
      {renderScreen()}
      <BottomNav />
    </div>
  );
};

export default ShoppingAnalyticsApp;