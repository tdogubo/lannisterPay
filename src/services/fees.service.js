const Fee = require("../models/fees.model");
const Redis = require("redis");
require("dotenv").config();

const redisClient = Redis.createClient({
  host: `${process.env.REDIS_HOST}`,
  port: `${process.env.REDIS_PORT}`,
});

const saveFeeConfigurations = (req, res) => {
  const feeString = req.body?.FeeConfigurationSpec;
  try {
    const feeConfiguration = feeString.split("\n");
    feeConfiguration.forEach(async (feeConfiguration) => {
      let id = feeConfiguration.match(/^[A-Z0-9]{8}/)?.at(0);
      let currency = feeConfiguration.match(/((?<=\d )\*)|( [A-Z]{3} )/)?.at(0);
      let locale = feeConfiguration
        .match(/ (LOCL|INTL|(\*)) /)
        ?.at(0)
        ?.split(" ")[1];
      let entity = feeConfiguration.match(/(([-]?[A-Z])+|\*)(?=\()/)?.at(0);
      let entityProperty = feeConfiguration.match(/\((.*?)\)/)?.at(1);
      let type = feeConfiguration.match(/(FLAT[\_]?|PERC)+/)?.at(0);
      let value = feeConfiguration.match(/([0-9]\:?\.?)*$/)?.at(0);
      const fee = { id, currency, locale, entity, entityProperty, type, value };

      await Fee.updateOne(fee, fee, { upsert: true });
    });
    return res.status(201).json({
      status: "success",
    });
  } catch (err) {
    return res.status(400).json({
      status: "failed",
    });
  }
};

const feeComputation = async (req, res) => {
  const { Customer, CurrencyCountry, PaymentEntity, Amount } = req.body;
  if (Customer?.BearsFee) {
    const locale =
      CurrencyCountry && PaymentEntity.Country
        ? CurrencyCountry === PaymentEntity.Country
          ? "LOCL"
          : "INTL"
        : "*";
    const entity = PaymentEntity.Type ? PaymentEntity.Type : "*";
    try {
      let cachedResponse = await redisClient.get(
        `fee?locale=${locale}?entity=${entity}?entityProperty=${PaymentEntity.Issuer}`
      );
      let response;
      if (cachedResponse != null) {
        response = JSON.parse(cachedResponse);
      } else {
        response = await Fee.findOne(
          {
            locale,
            entity,
            $or: [
              { entityProperty: PaymentEntity.ID },
              { entityProperty: PaymentEntity.Brand },
              { entityProperty: PaymentEntity.Number },
              { entityProperty: PaymentEntity.Issuer },
              { entityProperty: PaymentEntity.SixID },
              { entityProperty: "*" },
            ],
          },

          { id: 1, value: 1, type: 1 }
        )
          .lean()
          .sort({ entityProperty: -1 });
      }

      await redisClient.set(
        `fee?locale=${locale}?entity=${entity}?entityProperty=${PaymentEntity.Issuer}`,
        JSON.stringify(response)
      );

      let data;
      switch (response.type) {
        case "PERC":
          let percentage = response.value;
          let AppliedFeeValuePerc = Number((percentage * Number(Amount)) / 100);
          let ChargeAmountPerc = Number(Amount) + Number(AppliedFeeValuePerc);
          data = {
            AppliedFeeID: response.id,
            AppliedFeeValue: AppliedFeeValuePerc,
            ChargeAmount: ChargeAmountPerc,
            SettlementAmount: Amount,
          };

          return res.status(200).json(data);

        case "FLAT":
          let AppliedFeeValueFlat = response.value;
          let ChargeAmountFlat = Number(Amount) + Number(AppliedFeeValueFlat);
          data = {
            AppliedFeeID: response.id,
            AppliedFeeValue: AppliedFeeValueFlat,
            ChargeAmount: ChargeAmountFlat,
            SettlementAmount: Amount,
          };

          return res.status(200).json(data);
        case "FLAT_PERC":
          let flatPercFee = response.value;
          let [flat, perc] = flatPercFee.split(":");
          let AppliedFeeValueFlatPerc =
            Number(flat) + (Number(Amount) * Number(perc)) / 100;
          let ChargeAmountFlatPerc =
            Number(AppliedFeeValueFlatPerc) + Number(Amount);
          data = {
            AppliedFeeID: response.id,
            AppliedFeeValue: AppliedFeeValueFlatPerc,
            ChargeAmount: ChargeAmountFlatPerc,
            SettlementAmount: Amount,
          };

          return res.status(200).json(data);
      }
    } catch (err) {
      console.log(err.message);
      return res.status(200).json({ status: "failed" });
    }
  } else {
    return res.status(200).json({
      AppliedFeeValue: 0,
      ChargeAmount: Amount,
      SettlementAmount: Amount,
    });
  }
};

module.exports = { saveFeeConfigurations, feeComputation, redisClient };
