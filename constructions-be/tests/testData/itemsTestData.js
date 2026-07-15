// tests/testData/itemsTestData.js

const itemsTestData = {
  // Initial seed data matching the SQL schema
  seedData: [
    {
      item_id: 1,
      item_name: 'TMT Bar',
      item_description: 'Thermo-Mechanically Treated reinforcement steel bars',
      item_unit: 'kg',
      item_category: 'Structural',
      is_active: true
    },
    {
      item_id: 2,
      item_name: 'RMC',
      item_description: 'Ready Mix Concrete',
      item_unit: 'cum',
      item_category: 'Concrete',
      is_active: true
    },
    {
      item_id: 3,
      item_name: 'Miller Concrete',
      item_description: 'Pre-mixed concrete by Miller brand',
      item_unit: 'cum',
      item_category: 'Concrete',
      is_active: true
    },
    {
      item_id: 4,
      item_name: 'Brick',
      item_description: 'Standard clay bricks for construction',
      item_unit: 'pcs',
      item_category: 'Masonry',
      is_active: true
    },
    {
      item_id: 5,
      item_name: 'Mortar',
      item_description: 'Cement and sand mixture for binding masonry units',
      item_unit: 'cum',
      item_category: 'Masonry',
      is_active: true
    },
    {
      item_id: 6,
      item_name: 'Cement',
      item_description: 'Portland cement for construction',
      item_unit: 'bag',
      item_category: 'Binding Material',
      is_active: true
    },
    {
      item_id: 7,
      item_name: 'Sand',
      item_description: 'Fine aggregate for concrete and mortar',
      item_unit: 'cum',
      item_category: 'Aggregate',
      is_active: false  // Inactive for testing
    },
    {
      item_id: 8,
      item_name: 'Aggregate',
      item_description: 'Coarse stone aggregate for concrete',
      item_unit: 'cum',
      item_category: 'Aggregate',
      is_active: true
    }
  ],

  // Valid CREATE test cases
  validCreateData: [
    {
      name: 'Complete item with all fields',
      data: {
        item_name: 'Waterproofing Membrane',
        item_description: 'High-quality waterproofing membrane for terrace and bathroom',
        item_unit: 'sqm',
        item_category: 'Waterproofing',
        is_active: true
      },
      expected: {
        item_id: 9,
        item_name: 'Waterproofing Membrane',
        item_description: 'High-quality waterproofing membrane for terrace and bathroom',
        item_unit: 'sqm',
        item_category: 'Waterproofing',
        is_active: true
      }
    },
    {
      name: 'Minimal item with only required field',
      data: {
        item_name: 'Paint'
      },
      expected: {
        item_id: 9,
        item_name: 'Paint',
        item_description: null,
        item_unit: null,
        item_category: null,
        is_active: true  // Default value
      }
    },
    {
      name: 'Inactive item',
      data: {
        item_name: 'Discontinued Tile',
        item_description: 'Old model ceramic tile - discontinued',
        item_unit: 'sqft',
        item_category: 'Flooring',
        is_active: false
      },
      expected: {
        item_id: 9,
        is_active: false
      }
    },
    {
      name: 'Item with special characters',
      data: {
        item_name: 'Wire Mesh (6"x6")',
        item_description: 'Wire mesh with 6-inch spacing @ 2.5mm dia',
        item_unit: 'kg/m²',
        item_category: 'Reinforcement & Steel',
        is_active: true
      }
    }
  ],

  // Invalid CREATE test cases
  invalidCreateData: [
    {
      name: 'Missing item_name',
      data: {
        item_description: 'Missing item name',
        item_unit: 'kg',
        item_category: 'Test'
      },
      expectedError: 'Item name is required',
      expectedStatus: 400
    },
    {
      name: 'Empty item_name',
      data: {
        item_name: '',
        item_description: 'Empty name should fail'
      },
      expectedError: 'Item name is required',
      expectedStatus: 400
    },
    {
      name: 'Null item_name',
      data: {
        item_name: null,
        item_description: 'Null name should fail'
      },
      expectedError: 'Item name is required',
      expectedStatus: 400
    },
    {
      name: 'Item name too long',
      data: {
        item_name: 'A'.repeat(101),  // Exceeds VARCHAR(100)
        item_description: 'Name exceeds database limit'
      },
      expectedStatus: 500  // Database error
    }
  ],

  // Valid UPDATE test cases
  validUpdateData: [
    {
      name: 'Update all fields',
      itemId: 1,
      data: {
        item_name: 'Updated TMT Bar - Fe 550D',
        item_description: 'High-strength TMT bars with enhanced durability',
        item_unit: 'ton',
        item_category: 'Steel & Reinforcement',
        is_active: false
      }
    },
    {
      name: 'Update only description',
      itemId: 2,
      data: {
        item_name: 'RMC',  // Required field must be included
        item_description: 'Updated Ready Mix Concrete description',
        is_active: true
      }
    },
    {
      name: 'Deactivate item',
      itemId: 3,
      data: {
        item_name: 'Miller Concrete',
        is_active: false
      }
    }
  ],

  // Invalid UPDATE test cases
  invalidUpdateData: [
    {
      name: 'Update with empty name',
      itemId: 1,
      data: {
        item_name: '',
        item_description: 'Cannot have empty name'
      },
      expectedError: 'Item name is required',
      expectedStatus: 400
    },
    {
      name: 'Update non-existent item',
      itemId: 999,
      data: {
        item_name: 'Does not exist'
      },
      expectedError: 'Item not found',
      expectedStatus: 404
    }
  ],

  // DELETE test cases
  deleteTestCases: [
    {
      name: 'Delete existing item',
      itemId: 5,
      expectedMessage: 'Item deleted successfully',
      expectedStatus: 200
    },
    {
      name: 'Delete non-existent item',
      itemId: 999,
      expectedError: 'Item not found',
      expectedStatus: 404
    }
  ],

  // Search test cases
  searchTestCases: [
    {
      name: 'Search by name',
      query: 'concrete',
      expectedCount: 3,  // RMC, Miller Concrete, Sand (has concrete in description)
      expectedItems: ['RMC', 'Miller Concrete', 'Sand']
    },
    {
      name: 'Search by description',
      query: 'reinforcement',
      expectedCount: 1,
      expectedItems: ['TMT Bar']
    },
    {
      name: 'Search with no results',
      query: 'xyz123',
      expectedCount: 0,
      expectedItems: []
    },
    {
      name: 'Case insensitive search',
      query: 'CEMENT',
      expectedCount: 2,  // Cement item + Mortar (has cement in description)
      expectedItems: ['Cement', 'Mortar']
    }
  ],

  // Category filter test cases
  categoryTestCases: [
    {
      name: 'Filter by Concrete category',
      category: 'Concrete',
      expectedCount: 2,
      expectedItems: ['RMC', 'Miller Concrete']
    },
    {
      name: 'Filter by Aggregate category',
      category: 'Aggregate',
      expectedCount: 2,
      expectedItems: ['Sand', 'Aggregate']
    },
    {
      name: 'Filter by non-existent category',
      category: 'NonExistent',
      expectedCount: 0,
      expectedItems: []
    }
  ]
};

module.exports = itemsTestData;
