#!/usr/bin/env node

/**
 * Migration script for transitioning from single-file to multi-file CSV structure
 * This script helps identify and migrate existing data to the new format
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data directory
const testDataDir = path.join(__dirname, '../data/uploads');

/**
 * Extract file info from old naming convention
 * Expected format: BMW_[COUNTRY]_[YEAR]_[MONTH].csv
 */
function extractOldFileInfo(filename) {
  const match = filename.match(/BMW_([A-Z]{2})_(\d{4})_(\d{2})\.csv/);
  if (match) {
    return {
      country: match[1],
      year: parseInt(match[2]),
      month: parseInt(match[3]),
      monthName: new Date(parseInt(match[2]), parseInt(match[3]) - 1).toLocaleString('default', { month: 'long' })
    };
  }
  return null;
}

/**
 * Extract file info from new naming convention
 * Expected format: BMW_[COUNTRY]_[DIMENSION]_[YEAR]_[MONTH].csv
 */
function extractNewFileInfo(filename) {
  const match = filename.match(/BMW_([A-Z]{2})_([A-Za-z]+)_(\d{4})_(\d{2})\.csv/);
  if (match) {
    return {
      country: match[1],
      dimension: match[2],
      year: parseInt(match[3]),
      month: parseInt(match[4]),
      monthName: new Date(parseInt(match[3]), parseInt(match[4]) - 1).toLocaleString('default', { month: 'long' })
    };
  }
  return null;
}

/**
 * Analyze existing files and categorize them
 */
function analyzeFiles() {
  console.log('🔍 Analyzing existing files...');
  
  if (!fs.existsSync(testDataDir)) {
    console.error('❌ Test data directory not found:', testDataDir);
    return;
  }
  
  const files = fs.readdirSync(testDataDir).filter(f => f.endsWith('.csv'));
  console.log(`📁 Found ${files.length} CSV files`);
  
  const oldFormatFiles = [];
  const newFormatFiles = [];
  const unrecognizedFiles = [];
  
  files.forEach(filename => {
    const oldInfo = extractOldFileInfo(filename);
    const newInfo = extractNewFileInfo(filename);
    
    if (oldInfo && !newInfo) {
      oldFormatFiles.push({ filename, info: oldInfo });
    } else if (newInfo) {
      newFormatFiles.push({ filename, info: newInfo });
    } else {
      unrecognizedFiles.push(filename);
    }
  });
  
  console.log('\n📊 File Analysis Results:');
  console.log(`   Old format files: ${oldFormatFiles.length}`);
  console.log(`   New format files: ${newFormatFiles.length}`);
  console.log(`   Unrecognized files: ${unrecognizedFiles.length}`);
  
  if (oldFormatFiles.length > 0) {
    console.log('\n📁 Old Format Files:');
    oldFormatFiles.forEach(file => {
      console.log(`   - ${file.filename} (${file.info.country} ${file.info.monthName} ${file.info.year})`);
    });
  }
  
  if (newFormatFiles.length > 0) {
    console.log('\n📁 New Format Files:');
    const groupedNewFiles = {};
    newFormatFiles.forEach(file => {
      const key = `${file.info.country}_${file.info.year}_${file.info.month.toString().padStart(2, '0')}`;
      if (!groupedNewFiles[key]) {
        groupedNewFiles[key] = {
          country: file.info.country,
          year: file.info.year,
          month: file.info.month,
          monthName: file.info.monthName,
          files: []
        };
      }
      groupedNewFiles[key].files.push(file);
    });
    
    Object.keys(groupedNewFiles).forEach(key => {
      const group = groupedNewFiles[key];
      console.log(`   ${key}: ${group.country} ${group.monthName} ${group.year}`);
      group.files.forEach(file => {
        console.log(`     - ${file.filename} (${file.info.dimension})`);
      });
    });
  }
  
  if (unrecognizedFiles.length > 0) {
    console.log('\n⚠️ Unrecognized Files:');
    unrecognizedFiles.forEach(filename => {
      console.log(`   - ${filename}`);
    });
  }
  
  return {
    oldFormatFiles,
    newFormatFiles,
    unrecognizedFiles,
    groupedNewFiles: newFormatFiles.reduce((acc, file) => {
      const key = `${file.info.country}_${file.info.year}_${file.info.month.toString().padStart(2, '0')}`;
      if (!acc[key]) {
        acc[key] = {
          country: file.info.country,
          year: file.info.year,
          month: file.info.month,
          monthName: file.info.monthName,
          files: []
        };
      }
      acc[key].files.push(file);
      return acc;
    }, {})
  };
}

/**
 * Check for complete dimension sets
 */
function checkDimensionCompleteness(analysis) {
  console.log('\n🔍 Checking dimension completeness...');
  
  const expectedDimensions = ['All', 'CampaignType', 'ChannelType', 'ChannelName', 'Phase', 'Model'];
  
  Object.keys(analysis.groupedNewFiles).forEach(key => {
    const group = analysis.groupedNewFiles[key];
    const presentDimensions = group.files.map(f => f.info.dimension);
    const missingDimensions = expectedDimensions.filter(d => !presentDimensions.includes(d));
    
    console.log(`📁 ${key}: ${group.country} ${group.monthName} ${group.year}`);
    console.log(`   Present dimensions (${presentDimensions.length}/${expectedDimensions.length}):`, presentDimensions);
    
    if (missingDimensions.length > 0) {
      console.log(`   ⚠️ Missing dimensions:`, missingDimensions);
    } else {
      console.log(`   ✅ Complete dimension set`);
    }
    console.log('');
  });
}

/**
 * Generate migration recommendations
 */
function generateMigrationRecommendations(analysis) {
  console.log('\n💡 Migration Recommendations:');
  
  if (analysis.oldFormatFiles.length > 0) {
    console.log('\n📋 For Old Format Files:');
    console.log('   1. These files use the legacy single-file format');
    console.log('   2. They will be marked with "Legacy" dimension in the database');
    console.log('   3. Consider converting them to the new multi-file format for better organization');
    console.log('   4. The system will continue to support both formats');
  }
  
  if (Object.keys(analysis.groupedNewFiles).length > 0) {
    console.log('\n📋 For New Format Files:');
    console.log('   1. These files are already in the new multi-file format');
    console.log('   2. They will be processed with the new dimension-aware system');
    console.log('   3. Each market/month group will be processed as a unit');
    console.log('   4. Data from all dimensions will be combined into unified records');
  }
  
  console.log('\n📋 General Recommendations:');
  console.log('   1. Upload all dimension files for a market/month together');
  console.log('   2. Ensure all 6 dimension files are present for complete data');
  console.log('   3. Use consistent naming: BMW_[COUNTRY]_[DIMENSION]_[YEAR]_[MONTH].csv');
  console.log('   4. The system will automatically detect and group related files');
}

/**
 * Main migration analysis function
 */
function runMigrationAnalysis() {
  console.log('🚀 Starting migration analysis...');
  console.log('📂 Test data directory:', testDataDir);
  
  const analysis = analyzeFiles();
  
  if (analysis) {
    checkDimensionCompleteness(analysis);
    generateMigrationRecommendations(analysis);
  }
  
  console.log('\n✅ Migration analysis completed!');
}

// Run analysis if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrationAnalysis();
} 