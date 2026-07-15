    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Architect project drawing deleted successfully');
    
    // Verify drawing was actually deleted
    const deletedDrawing = await request(app).get('/architect-project-drawing/3');
    expect(deletedDrawing.status).toBe(404);
    
    const allDrawings = await request(app).get('/architect-project-drawing');
    expect(allDrawings.body.length).toBe(3);
  });
  
  // Test DELETE drawing - not found
  test('DELETE /architect-project-drawing/:id - should return 404 for non-existent drawing', async () => {
    const response = await request(app).delete('/architect-project-drawing/999');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Architect project drawing not found');
  });
  
  // Test foreign key constraints
  test('POST /architect-project-drawing - should handle foreign key violations', async () => {
    const invalidDrawing = {
      project_id: 999, // Non-existent project
      architect_id: 1,
      upload_architect_documents: '/uploads/invalid.pdf'
    };
    
    const response = await request(app)
      .post('/architect-project-drawing')
      .send(invalidDrawing);
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });
  
  // Test edge cases
  test('GET /architect-project-drawing/project/999 - should return empty array for non-existent project', async () => {
    const response = await request(app).get('/architect-project-drawing/project/999');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  test('GET /architect-project-drawing/architect/999 - should return empty array for non-existent architect', async () => {
    const response = await request(app).get('/architect-project-drawing/architect/999');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  test('GET /architect-project-drawing/client/999 - should return empty array for non-existent client', async () => {
    const response = await request(app).get('/architect-project-drawing/client/999');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  // Test data integrity
  test('Should maintain data consistency across operations', async () => {
    // Create a new drawing
    const newDrawing = {
      project_id: 2,
      architect_id: 3,
      client_id: 2,
      upload_architect_documents: '/uploads/consistency_test.pdf'
    };
    
    const createResponse = await request(app)
      .post('/architect-project-drawing')
      .send(newDrawing);
    
    expect(createResponse.status).toBe(201);
    const createdId = createResponse.body.id;
    
    // Verify it appears in various endpoints
    const allDrawings = await request(app).get('/architect-project-drawing');
    expect(allDrawings.body.some(d => d.id === createdId)).toBe(true);
    
    const projectDrawings = await request(app).get('/architect-project-drawing/project/2');
    expect(projectDrawings.body.some(d => d.id === createdId)).toBe(true);
    
    const architectDrawings = await request(app).get('/architect-project-drawing/architect/3');
    expect(architectDrawings.body.some(d => d.id === createdId)).toBe(true);
    
    const clientDrawings = await request(app).get('/architect-project-drawing/client/2');
    expect(clientDrawings.body.some(d => d.id === createdId)).toBe(true);
    
    // Update the drawing
    const updateData = {
      project_id: 3,
      architect_id: 1,
      client_id: 1,
      upload_architect_documents: '/uploads/updated_consistency_test.pdf'
    };
    
    const updateResponse = await request(app)
      .put(`/architect-project-drawing/${createdId}`)
      .send(updateData);
    
    expect(updateResponse.status).toBe(200);
    
    // Verify the update
    const updatedDrawing = await request(app).get(`/architect-project-drawing/${createdId}`);
    expect(updatedDrawing.body.project_id).toBe(3);
    expect(updatedDrawing.body.architect_id).toBe(1);
    expect(updatedDrawing.body.upload_architect_documents).toBe('/uploads/updated_consistency_test.pdf');
    
    // Delete the drawing
    const deleteResponse = await request(app).delete(`/architect-project-drawing/${createdId}`);
    expect(deleteResponse.status).toBe(200);
    
    // Verify it's gone
    const deletedCheck = await request(app).get(`/architect-project-drawing/${createdId}`);
    expect(deletedCheck.status).toBe(404);
  });
  
});

// Additional tests for specific business logic
describe('Business Logic Tests', () => {
  
  test('Should handle multiple drawings per project correctly', async () => {
    // Project 1 should have 2 drawings
    const project1Drawings = await request(app).get('/architect-project-drawing/project/1');
    expect(project1Drawings.body.length).toBe(2);
    
    // Add another drawing to project 1
    const newDrawing = {
      project_id: 1,
      architect_id: 2,
      client_id: 1,
      upload_architect_documents: '/uploads/additional_project1_drawing.pdf'
    };
    
    await request(app)
      .post('/architect-project-drawing')
      .send(newDrawing);
    
    // Now project 1 should have 3 drawings
    const updatedProject1Drawings = await request(app).get('/architect-project-drawing/project/1');
    expect(updatedProject1Drawings.body.length).toBe(3);
  });
  
  test('Should handle architect reassignment correctly', async () => {
    // Initially architect 1 has 2 drawings
    const architect1Drawings = await request(app).get('/architect-project-drawing/architect/1');
    expect(architect1Drawings.body.length).toBe(2);
    
    // Reassign one drawing to architect 2
    const updateData = {
      project_id: 1,
      architect_id: 2,
      client_id: 1,
      upload_architect_documents: '/uploads/riverside_master_plan.pdf'
    };
    
    await request(app)
      .put('/architect-project-drawing/1')
      .send(updateData);
    
    // Now architect 1 should have 1 drawing, architect 2 should have 3
    const updatedArch1Drawings = await request(app).get('/architect-project-drawing/architect/1');
    expect(updatedArch1Drawings.body.length).toBe(1);
    
    const updatedArch2Drawings = await request(app).get('/architect-project-drawing/architect/2');
    expect(updatedArch2Drawings.body.length).toBe(3);
  });
  
  test('Should maintain correct relationships in joined queries', async () => {
    const drawingsWithDetails = await request(app).get('/architect-project-drawing/with-details');
    
    // Check that each drawing has correct related data
    drawingsWithDetails.body.forEach(drawing => {
      if (drawing.id === 1) {
        expect(drawing.project_name).toBe('Riverside Township');
        expect(drawing.architect_username).toBe('architect1');
        expect(drawing.client_name).toBe('ABC Construction');
      }
      if (drawing.id === 4) {
        expect(drawing.project_name).toBe('Tech Park Phase II');
        expect(drawing.architect_username).toBe('architect2');
        expect(drawing.client_name).toBe('XYZ Developers');
      }
    });
  });
  
  test('Should handle null client_id in joined queries', async () => {
    // Create a drawing without client_id
    const drawingWithoutClient = {
      project_id: 3,
      architect_id: 1,
      upload_architect_documents: '/uploads/no_client_drawing.pdf'
    };
    
    await request(app)
      .post('/architect-project-drawing')
      .send(drawingWithoutClient);
    
    // Check that joined query handles null client gracefully
    const drawingsWithDetails = await request(app).get('/architect-project-drawing/with-details');
    const drawingWithNullClient = drawingsWithDetails.body.find(d => d.upload_architect_documents === '/uploads/no_client_drawing.pdf');
    
    expect(drawingWithNullClient).toBeDefined();
    expect(drawingWithNullClient.client_id).toBeNull();
    expect(drawingWithNullClient.client_name).toBeNull();
    expect(drawingWithNullClient.project_name).toBe('Tech Park Phase II');
  });
  
});

// Performance and edge case tests
describe('Performance and Edge Cases', () => {
  
  test('Should handle large file paths correctly', async () => {
    const longFilePath = '/uploads/' + 'a'.repeat(200) + '.pdf';
    
    const newDrawing = {
      project_id: 1,
      architect_id: 1,
      client_id: 1,
      upload_architect_documents: longFilePath
    };
    
    const response = await request(app)
      .post('/architect-project-drawing')
      .send(newDrawing);
    
    expect(response.status).toBe(201);
    expect(response.body.upload_architect_documents).toBe(longFilePath);
  });
  
  test('Should handle special characters in file paths', async () => {
    const specialFilePath = '/uploads/file with spaces & symbols (2024).pdf';
    
    const newDrawing = {
      project_id: 1,
      architect_id: 1,
      client_id: 1,
      upload_architect_documents: specialFilePath
    };
    
    const response = await request(app)
      .post('/architect-project-drawing')
      .send(newDrawing);
    
    expect(response.status).toBe(201);
    expect(response.body.upload_architect_documents).toBe(specialFilePath);
  });
  
  test('Should return consistent results for repeated queries', async () => {
    const firstCall = await request(app).get('/architect-project-drawing');
    const secondCall = await request(app).get('/architect-project-drawing');
    
    expect(firstCall.body).toEqual(secondCall.body);
  });
  
});
