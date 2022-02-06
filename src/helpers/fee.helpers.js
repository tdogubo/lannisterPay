const { Fee } = require("../models/fees.model");

const getFeeConfiguration = async (data, locale) => {
  const currency = data.Currency;
  const issuer = data.issuer;
  const entity = data.Type;
    const entityProperty = data.EntityProperty;
    
    switch (entity) {
        case "CREDIT-CARD":
            switch (entity) { 

            }
            break;
        case "DEBIT-CARD":
            break;
        case "BANK-ACCOUNT":
            break;
        case "USSD":
            break;
        case "WALLET-ID":
            break;
        
        default:
            break;
    }
};

module.exports = { getFeeConfiguration };
