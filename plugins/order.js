const address = '11 Times Square, New York, NY 10036';

const pizzapi = require('pizzapi');

const getStores = (address) => {
    return new Promise(resolve => {
        pizzapi.Util.findNearbyStores(
            address,
            'Delivery',
            function(storeData){
                var stores = storeData.result.Stores
                    .filter(store => store.IsOpen && store.IsOnlineCapable && store.IsOnlineNow)
                    .map(store => ({
                        StoreID: store.StoreID,
                        AddressDescription: store.AddressDescription
                            .split('\n')
                            .filter(line => line != 'ID IS REQUIRED FOR ALL CREDIT CARD ORDERS.')
                            .filter(line => line != 'ID IS REQUIRED FOR ALL CREDIT CARDS ORDERS.')
                            .join(' ')
                    }))
                    .sort((a, b) => parseInt(a.StoreID) - parseInt(b.StoreID));
                resolve(stores);
            }
        );
    });
}

const getStoreInfo = (ID) => {
    const myStore = new pizzapi.Store({
        ID
    })
    return new Promise(resolve => {
        myStore.getInfo(storeData => resolve(storeData))
    });
}

function setupConv(err, convo) {
    // Get address
    convo.addQuestion('Where would you like the pizza delivered?', (responseObj) => {
        getStores(responseObj.text).then(stores => {
            convo.setVar('stores', stores);
            convo.setVar('storesString', stores.map(s => `<${s.StoreID}>: <${s.AddressDescription}>)`).join('\n'));
            convo.gotoThread('chooseAddress');
        })
    }, {}, 'getAddress');
    convo.activate();
    convo.gotoThread(`getAddress`);

    // Choose address
    convo.addMessage(`{{vars.storesString}}`, `chooseAddress`)
    convo.addQuestion('Please choose a store ID', responseObj => {
        getStoreInfo(responseObj.text).then(storeInfo => {
            console.log(JSON.stringify(storeInfo, null, 4));
        })
    }, {}, 'chooseAddress');
}

module.exports = {
  init: (controller) => {
    controller.hears([/I want(\sa)? pizzas?/], ['direct_message', 'direct_mention'], (bot, message) => {
        bot.createConversation(message, setupConv)
    })
  },
  help: {
    command: 'order',
    text: `Say "I want a pizza" and I'll give ya a pizza`
  }
}
/*

Tell the user you have found some stores nearby and print the list. You should print <Store.StoreID>: <Store.AddressDescription> one on each line, sorted by StoreID. Try to format the address nicely (it should fit on one line and just be the address).
Only show stores that are Open, OnlineCapable, and IsOnlineNow.
Run npm test and fix all problems that you find.
Resources*/