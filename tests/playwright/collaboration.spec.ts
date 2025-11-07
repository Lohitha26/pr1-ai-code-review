/**
 * Collaborative Editing E2E Tests
 * 
 * Tests real-time collaboration features with multiple browser contexts.
 */

import { test, expect, Browser } from '@playwright/test';

test.describe('Real-Time Collaboration', () => {
  test('two users can edit simultaneously', async ({ browser }) => {
    // Create two separate browser contexts (simulating two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Both users navigate to home page
      await page1.goto('/');
      await page2.goto('/');

      // User 1 creates a new session
      await page1.click('text=Create New Session');
      await page1.waitForURL(/\/session\/.+/);
      
      // Get the session URL
      const sessionUrl = page1.url();
      const sessionId = sessionUrl.split('/').pop();

      // User 2 joins the same session
      await page2.goto(sessionUrl);
      await page2.waitForLoadState('networkidle');

      // Wait for editors to be ready
      await page1.waitForSelector('.monaco-editor', { timeout: 10000 });
      await page2.waitForSelector('.monaco-editor', { timeout: 10000 });

      // User 1 types some code
      const editor1 = page1.locator('.monaco-editor textarea').first();
      await editor1.focus();
      await editor1.type('console.log("Hello from User 1");');

      // Wait a bit for synchronization
      await page2.waitForTimeout(1000);

      // Verify User 2 sees the code
      const editor2Content = await page2.locator('.monaco-editor').textContent();
      expect(editor2Content).toContain('Hello from User 1');

      // User 2 adds more code
      const editor2 = page2.locator('.monaco-editor textarea').first();
      await editor2.focus();
      await editor2.press('End');
      await editor2.press('Enter');
      await editor2.type('console.log("Hello from User 2");');

      // Wait for synchronization
      await page1.waitForTimeout(1000);

      // Verify User 1 sees both lines
      const editor1Content = await page1.locator('.monaco-editor').textContent();
      expect(editor1Content).toContain('Hello from User 1');
      expect(editor1Content).toContain('Hello from User 2');

    } finally {
      // Cleanup
      await context1.close();
      await context2.close();
    }
  });

  test('chat messages are synchronized', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1 creates session
      await page1.goto('/');
      await page1.click('text=Create New Session');
      await page1.waitForURL(/\/session\/.+/);
      
      const sessionUrl = page1.url();

      // User 2 joins
      await page2.goto(sessionUrl);
      await page2.waitForLoadState('networkidle');

      // Ensure chat is visible
      if (!(await page1.locator('text=Chat').isVisible())) {
        await page1.click('button:has-text("Chat")');
      }
      if (!(await page2.locator('text=Chat').isVisible())) {
        await page2.click('button:has-text("Chat")');
      }

      // User 1 sends a message
      await page1.fill('input[placeholder*="message"]', 'Hello from User 1!');
      await page1.click('button:has-text("Send")');

      // Wait for message to appear
      await page1.waitForSelector('text=Hello from User 1!');

      // Verify User 2 receives the message
      await page2.waitForSelector('text=Hello from User 1!', { timeout: 5000 });

      // User 2 replies
      await page2.fill('input[placeholder*="message"]', 'Hi User 1!');
      await page2.click('button:has-text("Send")');

      // Verify User 1 receives the reply
      await page1.waitForSelector('text=Hi User 1!', { timeout: 5000 });

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('participants list updates', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1 creates session
      await page1.goto('/');
      await page1.click('text=Create New Session');
      await page1.waitForURL(/\/session\/.+/);
      
      const sessionUrl = page1.url();

      // Initially should show 1 participant
      await expect(page1.locator('text=1 participant')).toBeVisible();

      // User 2 joins
      await page2.goto(sessionUrl);
      await page2.waitForLoadState('networkidle');

      // Should now show 2 participants
      await expect(page1.locator('text=2 participants')).toBeVisible({ timeout: 5000 });
      await expect(page2.locator('text=2 participants')).toBeVisible();

    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('AI Code Review', () => {
  test('can request AI code review', async ({ page }) => {
    // Navigate to a session
    await page.goto('/');
    await page.click('text=Create New Session');
    await page.waitForURL(/\/session\/.+/);

    // Wait for editor to load
    await page.waitForSelector('.monaco-editor', { timeout: 10000 });

    // Type some code
    const editor = page.locator('.monaco-editor textarea').first();
    await editor.focus();
    await editor.type('function test() { var x = 1; }');

    // Open AI review panel
    await page.click('button:has-text("AI Review")');

    // Request review
    await page.click('button:has-text("Review Code")');

    // Wait for loading state
    await expect(page.locator('button:has-text("Analyzing")')).toBeVisible();

    // Wait for results (may take a few seconds)
    await expect(page.locator('text=Summary')).toBeVisible({ timeout: 30000 });

    // Verify suggestions appear
    const suggestionsCount = await page.locator('text=Suggestions').count();
    expect(suggestionsCount).toBeGreaterThan(0);
  });
});

test.describe('Session Management', () => {
  test('can create and list sessions', async ({ page }) => {
    await page.goto('/');

    // Navigate to sessions list
    await page.click('text=Join Session');
    await page.waitForURL('/sessions');

    // Create a new session
    await page.click('text=Create Session');
    
    // Fill in session details
    await page.fill('input[name="name"]', 'Test Session');
    await page.fill('textarea[name="description"]', 'This is a test session');
    await page.selectOption('select[name="language"]', 'typescript');
    
    // Submit
    await page.click('button[type="submit"]:has-text("Create")');

    // Should navigate to the new session
    await page.waitForURL(/\/session\/.+/);

    // Verify we're in the session
    await expect(page.locator('text=Session:')).toBeVisible();
  });

  test('sessions list shows created sessions', async ({ page }) => {
    await page.goto('/sessions');

    // Should show sessions or empty state
    const hasSessions = await page.locator('text=No sessions available').isVisible();
    
    if (!hasSessions) {
      // Verify session cards are displayed
      await expect(page.locator('.grid')).toBeVisible();
    }
  });
});
