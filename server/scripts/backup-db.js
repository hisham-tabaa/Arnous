#!/usr/bin/env node

/**
 * Database Backup Script
 * This script creates backups of the MongoDB database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs-extra');
const path = require('path');

// MongoDB connection options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,
  bufferCommands: false
};

// Connect to MongoDB
async function connectDB() {
  try {
    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(mongoURI, mongoOptions);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Create backup directory
async function createBackupDirectory() {
  const backupDir = path.join(__dirname, '..', 'backups');
  await fs.ensureDir(backupDir);
  return backupDir;
}

// Create backup of collections
async function createBackup() {
  try {
    console.log('💾 Starting database backup...');
    
    const backupDir = await createBackupDirectory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup_${timestamp}`);
    
    await fs.ensureDir(backupPath);
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`📊 Found ${collections.length} collections to backup`);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`   Backing up collection: ${collectionName}`);
      
      // Get collection data
      const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      
      // Save to file
      const filePath = path.join(backupPath, `${collectionName}.json`);
      await fs.writeJson(filePath, data, { spaces: 2 });
      
      console.log(`     ✅ ${collectionName}: ${data.length} documents`);
    }
    
    // Create backup info file
    const backupInfo = {
      timestamp: new Date().toISOString(),
      database: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name),
      totalCollections: collections.length,
      backupPath: backupPath
    };
    
    const infoPath = path.join(backupPath, 'backup-info.json');
    await fs.writeJson(infoPath, backupInfo, { spaces: 2 });
    
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`   Location: ${backupPath}`);
    console.log(`   Collections: ${collections.length}`);
    
    // Clean old backups (keep last 10)
    await cleanOldBackups(backupDir);
    
    return backupPath;
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Clean old backups
async function cleanOldBackups(backupDir) {
  try {
    const backups = await fs.readdir(backupDir);
    const backupDirs = backups.filter(name => name.startsWith('backup_'));
    
    if (backupDirs.length > 10) {
      console.log('🧹 Cleaning old backups...');
      
      // Sort by creation time (oldest first)
      const sortedBackups = backupDirs
        .map(name => ({ name, path: path.join(backupDir, name) }))
        .sort((a, b) => {
          const statsA = fs.statSync(a.path);
          const statsB = fs.statSync(b.path);
          return statsA.birthtime - statsB.birthtime;
        });
      
      // Remove oldest backups
      const toRemove = sortedBackups.slice(0, backupDirs.length - 10);
      
      for (const backup of toRemove) {
        await fs.remove(backup.path);
        console.log(`   🗑️  Removed: ${backup.name}`);
      }
      
      console.log(`   ✅ Cleaned ${toRemove.length} old backups`);
    }
  } catch (error) {
    console.error('⚠️  Warning: Failed to clean old backups:', error);
  }
}

// Restore backup
async function restoreBackup(backupPath) {
  try {
    console.log(`🔄 Starting backup restoration from: ${backupPath}`);
    
    if (!await fs.pathExists(backupPath)) {
      throw new Error(`Backup path does not exist: ${backupPath}`);
    }
    
    // Read backup info
    const infoPath = path.join(backupPath, 'backup-info.json');
    if (!await fs.pathExists(infoPath)) {
      throw new Error('Backup info file not found');
    }
    
    const backupInfo = await fs.readJson(infoPath);
    console.log(`📊 Backup info: ${backupInfo.collections.length} collections`);
    
    // Confirm restoration
    console.log('⚠️  WARNING: This will overwrite existing data!');
    console.log('   Are you sure you want to continue? (y/N)');
    
    // In a real script, you would read from stdin
    // For now, we'll just log the warning
    console.log('   Database restoration cancelled for safety');
    console.log('   To restore the database, manually copy files or use MongoDB commands');
    
  } catch (error) {
    console.error('❌ Backup restoration failed:', error);
    throw error;
  }
}

// List available backups
async function listBackups() {
  try {
    const backupDir = await createBackupDirectory();
    const backups = await fs.readdir(backupDir);
    const backupDirs = backups.filter(name => name.startsWith('backup_'));
    
    if (backupDirs.length === 0) {
      console.log('📂 No backups found');
      return;
    }
    
    console.log('📂 Available backups:');
    
    for (const backup of backupDirs) {
      const backupPath = path.join(backupDir, backup);
      const infoPath = path.join(backupPath, 'backup-info.json');
      
      try {
        if (await fs.pathExists(infoPath)) {
          const info = await fs.readJson(infoPath);
          const stats = await fs.stat(backupPath);
          
          console.log(`   📁 ${backup}`);
          console.log(`      Date: ${info.timestamp}`);
          console.log(`      Collections: ${info.collections.length}`);
          console.log(`      Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
          console.log(`      Created: ${stats.birthtime.toISOString()}`);
          console.log('');
        }
      } catch (error) {
        console.log(`   📁 ${backup} (corrupted)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to list backups:', error);
  }
}

// Main function
async function main() {
  try {
    const args = process.argv.slice(2);
    const command = args[0];
    
    await connectDB();
    
    switch (command) {
      case 'create':
      case undefined:
        await createBackup();
        break;
      case 'restore':
        const backupPath = args[1];
        if (!backupPath) {
          console.error('❌ Please specify backup path: npm run backup:restore <path>');
          process.exit(1);
        }
        await restoreBackup(backupPath);
        break;
      case 'list':
        await listBackups();
        break;
      default:
        console.log('❌ Unknown command. Available commands:');
        console.log('   create  - Create a new backup');
        console.log('   restore - Restore from backup');
        console.log('   list    - List available backups');
        process.exit(1);
    }
    
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  connectDB,
  createBackup,
  restoreBackup,
  listBackups,
  cleanOldBackups
};
