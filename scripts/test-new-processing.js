#!/usr/bin/env node

/**
 * Test script for the new multi-file CSV processing system
 * This script tests the processing of the new France data structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test data directory
const testDataDir = path.join(__dirname, '../data/uploads');

// Expected columns for BMW data validation - now varies by dimension
const expectedColumnsByDimension = {
  'All': [
    'Country', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'CampaignType': [
    'Country', 'Campaign Type', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'ChannelType': [
    'Country', 'Channel Type', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'ChannelName': [
    'Country', 'Channel Name', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'Phase': [
    'Country', 'Phase', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ],
  'Model': [
    'Country', 'Model', 'Media Cost', 'Impressions', 'CPM', 'Clicks', 'CTR', 'CPC', 'IV', 'CP IV',
    'Entry Rate', 'NVWR', 'Cp NVWR', 'CVR', 'DCS (pre) Order', 'CP DCS (pre) Order', 'Meta Leads', 'Cp lead Forms'
  ]
};

// Alternative column names that should be accepted
const alternativeColumns = {
  'Meta_Leads': 'Meta Leads',  // Handle underscore vs space
  'CP NVWR': 'Cp NVWR',        // Handle case variations
  'CP Lead Forms': 'Cp lead Forms',  // Handle case variations
  'Model ': 'Model'            // Handle trailing space
};

// Columns that should be ignored
const ignoredColumns = [
  'Line Item (Free Field)',
  'Campaign Detail (Free Field)'
];

/**
 * Extract file info from new naming convention
 * Expected format: BMW_[COUNTRY]_[DIMENSION]_[YEAR]_[MONTH].csv
 * Examples: BMW_FR_All_2025_07.csv, BMW_FR_CampaignType_2025_07.csv
 */
function extractFileInfo(filename) {
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
 * Validate CSV structure against expected columns for the specific dimension
 */
function validateCSVStructure(data, dimension) {
  if (data.length === 0) {
    const expectedColumns = expectedColumnsByDimension[dimension] || [];
    return { isValid: false, missingColumns: expectedColumns, headers: [] };
  }
  
  const headers = Object.keys(data[0]);
  
  // Filter out ignored columns and normalize the rest
  const filteredHeaders = headers.filter(header => !ignoredColumns.includes(header));
  
  const normalizedHeaders = filteredHeaders.map(header => {
    return alternativeColumns[header] || header;
  });
  
  const expectedColumns = expectedColumnsByDimension[dimension] || [];
  const missingRequiredColumns = expectedColumns.filter(col => !normalizedHeaders.includes(col));
  
  return {
    isValid: missingRequiredColumns.length === 0,
    missingColumns: missingRequiredColumns,
    headers: normalizedHeaders,
    originalHeaders: headers,
    dimension: dimension
  };
}

/**
 * Test file info extraction
 */
function testFileInfoExtraction() {
  console.log('\n🧪 Testing file info extraction...');
  
  const testFiles = [
    'BMW_FR_All_2025_07.csv',
    'BMW_FR_CampaignType_2025_07.csv',
    'BMW_FR_ChannelType_2025_07.csv',
    'BMW_FR_ChannelName_2025_07.csv',
    'BMW_FR_Phase_2025_07.csv',
    'BMW_FR_Model_2025_07.csv'
  ];
  
  testFiles.forEach(filename => {
    const fileInfo = extractFileInfo(filename);
    console.log(`📁 ${filename}:`, fileInfo);
    
    if (!fileInfo) {
      console.error(`❌ Failed to extract info from ${filename}`);
    } else if (fileInfo.country !== 'FR' || fileInfo.year !== 2025 || fileInfo.month !== 7) {
      console.error(`❌ Invalid file info for ${filename}:`, fileInfo);
    } else {
      console.log(`✅ Valid file info for ${filename}`);
    }
  });
}

/**
 * Test CSV validation for each dimension
 */
function testCSVValidation() {
  console.log('\n🧪 Testing CSV validation...');
  
  const dimensionFiles = [
    { filename: 'BMW_FR_All_2025_07.csv', dimension: 'All' },
    { filename: 'BMW_FR_CampaignType_2025_07.csv', dimension: 'CampaignType' },
    { filename: 'BMW_FR_ChannelType_2025_07.csv', dimension: 'ChannelType' },
    { filename: 'BMW_FR_ChannelName_2025_07.csv', dimension: 'ChannelName' },
    { filename: 'BMW_FR_Phase_2025_07.csv', dimension: 'Phase' },
    { filename: 'BMW_FR_Model_2025_07.csv', dimension: 'Model' }
  ];
  
  dimensionFiles.forEach(({ filename, dimension }) => {
    const filePath = path.join(testDataDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filename}`);
      return;
    }
    
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Create mock data structure
    const mockData = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        mockData.push(row);
      }
    }
    
    const validation = validateCSVStructure(mockData, dimension);
    console.log(`📊 ${filename} (${dimension}):`, {
      isValid: validation.isValid,
      missingColumns: validation.missingColumns,
      headers: validation.headers.length
    });
    
    if (!validation.isValid) {
      console.error(`❌ Validation failed for ${filename}:`, validation.missingColumns);
    } else {
      console.log(`✅ Validation passed for ${filename}`);
    }
  });
}

/**
 * Test data structure analysis
 */
function testDataStructure() {
  console.log('\n🧪 Testing data structure analysis...');
  
  const dimensionFiles = [
    { filename: 'BMW_FR_All_2025_07.csv', dimension: 'All' },
    { filename: 'BMW_FR_CampaignType_2025_07.csv', dimension: 'CampaignType' },
    { filename: 'BMW_FR_ChannelType_2025_07.csv', dimension: 'ChannelType' },
    { filename: 'BMW_FR_ChannelName_2025_07.csv', dimension: 'ChannelName' },
    { filename: 'BMW_FR_Phase_2025_07.csv', dimension: 'Phase' },
    { filename: 'BMW_FR_Model_2025_07.csv', dimension: 'Model' }
  ];
  
  dimensionFiles.forEach(({ filename, dimension }) => {
    const filePath = path.join(testDataDir, filename);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filename}`);
      return;
    }
    
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log(`📊 ${filename} (${dimension}):`);
    console.log(`   Headers (${headers.length}):`, headers);
    console.log(`   Data rows: ${lines.length - 1}`);
    
    // Show first data row
    if (lines.length > 1) {
      const firstDataLine = lines[1];
      const values = firstDataLine.split(',').map(v => v.trim());
      console.log(`   First row sample:`, values.slice(0, 5).join(', ') + '...');
    }
    console.log('');
  });
}

/**
 * Test file grouping by market and month
 */
function testFileGrouping() {
  console.log('\n🧪 Testing file grouping by market and month...');
  
  const files = fs.readdirSync(testDataDir).filter(f => f.endsWith('.csv'));
  
  // Group files by market and month
  const groupedFiles = {};
  files.forEach(filename => {
    const fileInfo = extractFileInfo(filename);
    if (fileInfo) {
      const key = `${fileInfo.country}_${fileInfo.year}_${fileInfo.month.toString().padStart(2, '0')}`;
      if (!groupedFiles[key]) {
        groupedFiles[key] = {
          country: fileInfo.country,
          year: fileInfo.year,
          month: fileInfo.month,
          monthName: fileInfo.monthName,
          files: []
        };
      }
      groupedFiles[key].files.push({
        filename,
        dimension: fileInfo.dimension,
        fileInfo
      });
    }
  });
  
  Object.keys(groupedFiles).forEach(key => {
    const group = groupedFiles[key];
    console.log(`📁 ${key}: ${group.country} ${group.monthName} ${group.year}`);
    console.log(`   Files (${group.files.length}):`);
    group.files.forEach(file => {
      console.log(`     - ${file.filename} (${file.dimension})`);
    });
    console.log('');
  });
}

/**
 * Main test function
 */
function runTests() {
  console.log('🚀 Starting new CSV processing system tests...');
  console.log('📂 Test data directory:', testDataDir);
  
  if (!fs.existsSync(testDataDir)) {
    console.error('❌ Test data directory not found:', testDataDir);
    return;
  }
  
  const files = fs.readdirSync(testDataDir).filter(f => f.endsWith('.csv'));
  console.log(`📁 Found ${files.length} CSV files in test directory`);
  
  testFileInfoExtraction();
  testCSVValidation();
  testDataStructure();
  testFileGrouping();
  
  console.log('\n✅ All tests completed!');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
} 