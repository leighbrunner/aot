import * as wafv2 from 'aws-cdk-lib/aws-wafv2'
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class WafRules extends Construct {
  public readonly webAcl: wafv2.CfnWebACL

  constructor(scope: Construct, id: string) {
    super(scope, id)

    // Create IP rate limiting rule
    const rateLimitRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'RateLimitRule',
      priority: 1,
      statement: {
        rateBasedStatement: {
          limit: 2000, // 2000 requests per 5 minutes
          aggregateKeyType: 'IP',
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'RateLimitRule',
      },
    }

    // Geo-blocking rule (example: block certain countries)
    const geoBlockRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'GeoBlockingRule',
      priority: 2,
      statement: {
        geoMatchStatement: {
          countryCodes: ['CN', 'RU', 'KP'], // Example blocked countries
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'GeoBlockingRule',
      },
    }

    // SQL injection protection
    const sqlInjectionRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'SQLInjectionRule',
      priority: 3,
      statement: {
        orStatement: {
          statements: [
            {
              sqliMatchStatement: {
                fieldToMatch: {
                  body: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            {
              sqliMatchStatement: {
                fieldToMatch: {
                  queryString: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                ],
              },
            },
          ],
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SQLInjectionRule',
      },
    }

    // XSS protection
    const xssRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'XSSProtectionRule',
      priority: 4,
      statement: {
        orStatement: {
          statements: [
            {
              xssMatchStatement: {
                fieldToMatch: {
                  body: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            {
              xssMatchStatement: {
                fieldToMatch: {
                  queryString: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                ],
              },
            },
          ],
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'XSSProtectionRule',
      },
    }

    // Size constraint rule
    const sizeConstraintRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'SizeConstraintRule',
      priority: 5,
      statement: {
        sizeConstraintStatement: {
          fieldToMatch: {
            body: {},
          },
          comparisonOperator: 'GT',
          size: 8192, // 8KB limit for request body
          textTransformations: [
            {
              priority: 0,
              type: 'NONE',
            },
          ],
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SizeConstraintRule',
      },
    }

    // Admin path protection
    const adminPathRule: wafv2.CfnWebACL.RuleProperty = {
      name: 'AdminPathProtection',
      priority: 6,
      statement: {
        andStatement: {
          statements: [
            {
              byteMatchStatement: {
                fieldToMatch: {
                  uriPath: {},
                },
                positionalConstraint: 'STARTS_WITH',
                searchString: '/admin',
                textTransformations: [
                  {
                    priority: 0,
                    type: 'LOWERCASE',
                  },
                ],
              },
            },
            {
              notStatement: {
                statement: {
                  ipSetReferenceStatement: {
                    arn: this.createAdminIpSet().attrArn,
                  },
                },
              },
            },
          ],
        },
      },
      action: {
        block: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'AdminPathProtection',
      },
    }

    // Create Web ACL
    this.webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      rules: [
        rateLimitRule,
        geoBlockRule,
        sqlInjectionRule,
        xssRule,
        sizeConstraintRule,
        adminPathRule,
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'VotingAppWebACL',
      },
    })
  }

  private createAdminIpSet(): wafv2.CfnIPSet {
    return new wafv2.CfnIPSet(this, 'AdminIPSet', {
      scope: 'REGIONAL',
      ipAddressVersion: 'IPV4',
      addresses: [
        // Add your admin IP addresses here
        // '203.0.113.0/24', // Example admin network
      ],
    })
  }
}