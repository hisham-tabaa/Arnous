/**
 * MongoDB Initialization Script
 * This script runs when MongoDB container starts for the first time
 */

// Create database and user
db = db.getSiblingDB('arnous_exchange');

// Create user for the application
db.createUser({
  user: 'arnous_user',
  pwd: 'arnous_password_123',
  roles: [
    {
      role: 'readWrite',
      db: 'arnous_exchange'
    }
  ]
});

// Create collections with validation
db.createCollection('currencies', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['code', 'name', 'buyRate', 'sellRate'],
      properties: {
        code: {
          bsonType: 'string',
          enum: ['USD', 'EUR', 'GBP', 'TRY']
        },
        name: {
          bsonType: 'string'
        },
        buyRate: {
          bsonType: 'number',
          minimum: 0
        },
        sellRate: {
          bsonType: 'number',
          minimum: 0
        }
      }
    }
  }
});

db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password', 'role'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 50
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        role: {
          enum: ['admin', 'user', 'moderator']
        }
      }
    }
  }
});

db.createCollection('activitylogs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user', 'action', 'resource'],
      properties: {
        action: {
          enum: [
            'login', 'logout', 'currency_update', 'currency_create',
            'currency_delete', 'social_publish', 'user_create',
            'user_update', 'user_delete', 'password_change', 'profile_update'
          ]
        },
        resource: {
          enum: ['currency', 'user', 'social_media', 'system', 'auth']
        },
        status: {
          enum: ['success', 'failure', 'pending']
        }
      }
    }
  }
});

// Create indexes for better performance
db.currencies.createIndex({ 'code': 1 }, { unique: true });
db.currencies.createIndex({ 'isActive': 1 });
db.currencies.createIndex({ 'lastUpdated': -1 });

db.users.createIndex({ 'username': 1 }, { unique: true });
db.users.createIndex({ 'email': 1 }, { unique: true });
db.users.createIndex({ 'role': 1 });
db.users.createIndex({ 'isActive': 1 });

db.activitylogs.createIndex({ 'user': 1, 'createdAt': -1 });
db.activitylogs.createIndex({ 'action': 1, 'createdAt': -1 });
db.activitylogs.createIndex({ 'resource': 1, 'createdAt': -1 });
db.activitylogs.createIndex({ 'status': 1, 'createdAt': -1 });

// Insert default data
db.currencies.insertMany([
  {
    code: 'USD',
    name: 'US Dollar',
    buyRate: 15000,
    sellRate: 15100,
    isActive: true,
    lastUpdated: new Date(),
    createdBy: 'system',
    updateHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    code: 'EUR',
    name: 'Euro',
    buyRate: 16500,
    sellRate: 16600,
    isActive: true,
    lastUpdated: new Date(),
    createdBy: 'system',
    updateHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    code: 'GBP',
    name: 'British Pound',
    buyRate: 19000,
    sellRate: 19100,
    isActive: true,
    lastUpdated: new Date(),
    createdBy: 'system',
    updateHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    buyRate: 500,
    sellRate: 510,
    isActive: true,
    lastUpdated: new Date(),
    createdBy: 'system',
    updateHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print('✅ MongoDB initialization completed successfully!');
print('   Database: arnous_exchange');
print('   User: arnous_user');
print('   Collections: currencies, users, activitylogs');
print('   Default currencies: USD, EUR, GBP, TRY');
