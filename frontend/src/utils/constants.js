/**
 * HMS IAP Constants based on Huawei Developer Documentation
 * https://developer.huawei.com/consumer/en/doc/development/HMSCore-References/iap-api-return-codes-0000001050746168
 */

export const PRICE_TYPE = {
  CONSUMABLE: 0,
  NON_CONSUMABLE: 1,
  SUBSCRIPTION: 2
};

export const HMS_ORDER_STATUS = {
  SUCCESS: 0,
  CANCELLED: 60051,
  PRODUCT_OWNED: 60056,
  NOT_LOGGED_IN: 60050,
  NETWORK_ERROR: 60052,
  BILLING_UNAVAILABLE: 60054,
  SYSTEM_ERROR: -1
};

export const PRODUCT_IDS = {
  CONSUMABLES: [
    "Quick.Insight",
    "Past.Present.Future",
    "Deep.Dive",
    "Astrological.Chart.Reading"
  ],
  SUBSCRIPTIONS: [
    "10.Readings_Month",
    "20.Readings_Month",
    "30.Readings_Month1"
  ]
};
