const Fee = require("../models/fees.model");
const { getFeeConfiguration } = require("../helpers/fee.helpers");

const saveFeeConfigurations = (req, res) => {
  const feeString = req.body?.FeeConfigurationSpec;
  try {
    const feeConfiguration = feeString.split("\n");
    feeConfiguration.forEach(async (feeConfiguration) => {
      let id = feeConfiguration.match(/^[A-Z0-9]{8}/)?.at(0);
      // let currency = feeConfiguration.match(/( [A-Z]{3} )/)?.at(0);
      let currency = feeConfiguration.match(/((?<=\d )\*)|( [A-Z]{3} )/)?.at(0);
      let locale = feeConfiguration
        .match(/ (LOCL|INTL|(\*)) /)
        ?.at(0)
        .split(" ")[1];
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

  //   return feeEntities.map((feeEntity) => {
  //     const feeConfiguration = feeConfigurationsMap[feeEntity];
  //     return {
  //       feeEntity,
  //       feeConfiguration,
  //     };
  //   });
};

const feeComputation = async (req, res) => {
  const {Customer, CurrencyCountry, PaymentEntity, Amount } = req.body;
  if (Customer?.BearsFee) {
    let defaultValue = "*".split('"');
    console.log(defaultValue);
    const locale =
      CurrencyCountry && PaymentEntity.Country
        ? CurrencyCountry === PaymentEntity.Country
          ? "LOCL"
          : "INTL"
        : "*";
    try {
      let response = await Fee.findOne(
        {
          $or: [
            {
              locale,
              entity: PaymentEntity.Type,

              entityProperty: {
                $in: [
                  PaymentEntity.ID,
                  PaymentEntity.Brand,
                  PaymentEntity.Number,
                  PaymentEntity.Issuer,
                  PaymentEntity.SixID,
                ],
              },
            },
            { locale, entity: PaymentEntity.Type, entityProperty: "*" },
          ],
        },
        { id: 1, value: 1, type: 1 }
      ).lean();
      
      console.log(response);
      let data;
      console.log(response.type);
      switch (response[0].type) {
        case "PERC":
          let percentage = response.value;
          let AppliedFeeValuePerc = Number((percentage * Number(Amount)) / 100);
          let ChargeAmountPerc = Number(Amount) + Number(AppliedFeeValue);
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

          console.log(flatFee);
          return res.status(200).json(data);
        case "FLAT_PERC":
          let flatPercFee = response[0].value;
          let [flat, perc] = flatPercFee.split(":");
          let AppliedFeeValueFlatPerc =
            Number(flat) + (Number(Amount) * Number(perc)) / 100;
          let ChargeAmountFlatPerc =
            Number(AppliedFeeValueFlatPerc) + Number(Amount);
          console.log(ChargeAmountFlatPerc);
          data = {
            AppliedFeeID: response[0].id,
            AppliedFeeValue: AppliedFeeValueFlatPerc,
            ChargeAmount: ChargeAmountFlatPerc,
            SettlementAmount: Amount,
          };

          console.log(data);
        // return res.status(200).json(data);
      }
      return res.status(200).json(response);
    } catch (err) {
      console.log(err);
    }
  } else {
    return res.status(200).json({
      AppliedFeeID: "",
      AppliedFeeValue: "",
      ChargeAmount: Amount,
      SettlementAmount: Amount,
    });
  }
};

module.exports = { saveFeeConfigurations, feeComputation };
