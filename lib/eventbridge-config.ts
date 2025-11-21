// AWS EventBridge Configuration Helper
// This file contains constants and utilities for EventBridge integration

export const EVENTBRIDGE_CONFIG = {
  // Cron expression for daily checks at 8 AM UTC
  SCHEDULE_EXPRESSION: "cron(0 8 * * ? *)",

  // Alert thresholds in days
  ALERT_THRESHOLDS: [60, 30, 14, 7],

  // API endpoint path
  CRON_ENDPOINT: "/api/cron/check-renewal-alerts",

  // Authorization
  getAuthHeader: (secretKey: string) => ({
    Authorization: `Bearer ${secretKey}`,
  }),
} as const

/**
 * Generate EventBridge rule configuration
 * Use this when setting up the EventBridge rule programmatically
 */
export function generateEventBridgeRuleConfig(amplifyDomain: string, cronSecretKey: string) {
  return {
    Name: "DailySubscriptionRenewalCheck",
    Description: "Daily check for subscription renewal alerts",
    ScheduleExpression: EVENTBRIDGE_CONFIG.SCHEDULE_EXPRESSION,
    State: "ENABLED",
    Targets: [
      {
        Arn: `https://${amplifyDomain}${EVENTBRIDGE_CONFIG.CRON_ENDPOINT}`,
        HttpParameters: {
          HeaderParameters: {
            Authorization: `Bearer ${cronSecretKey}`,
          },
        },
        RoleArn: "arn:aws:iam::YOUR_ACCOUNT_ID:role/EventBridgeRole",
      },
    ],
  }
}
