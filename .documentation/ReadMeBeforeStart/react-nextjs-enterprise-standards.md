# React & Next.js Enterprise Development Standards

> Based on VS Code Ninja project - A comprehensive guide for writing high-quality, maintainable, enterprise-level React/Next.js code

---

## Table of Contents

1. [Project Structure & Organization](#project-structure--organization)
2. [Component Architecture](#component-architecture)
3. [React Hooks Rules & Best Practices](#react-hooks-rules--best-practices)
4. [State Management](#state-management)
5. [Code Quality & Defensive Programming](#code-quality--defensive-programming)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling](#error-handling)
8. [API Integration](#api-integration)
9. [String Processing & HTML Safety](#string-processing--html-safety)
10. [Date and Timezone Handling](#date-and-timezone-handling-defensive-programming)
11. [Styling & UI Consistency](#styling--ui-consistency)
12. [TypeScript Best Practices](#typescript-best-practices)
13. [Testing Strategy](#testing-strategy)
14. [Common Pitfalls & Solutions](#common-pitfalls--solutions)

---

## 1. Project Structure & Organization

### Directory Structure

Organize code by feature and purpose, not by file type:

```
project/
├── app/                    # Next.js App Router pages
│   ├── page.js
│   ├── layout.js
│   └── globals.css
├── components/             # UI components organized by feature
│   ├── FeatureA/
│   │   ├── ComponentA.js
│   │   ├── ComponentB.js
│   │   └── SubComponent.js
│   ├── FeatureB/
│   └── SharedComponent.js
├── lib/                    # Business logic & utilities
│   ├── constants/          # Configuration constants
│   ├── data/              # Static data & content
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Pure utility functions
│   └── api/               # API clients & services
└── README.md
```

### File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.js`, `VideoPlayer.js`)
- **Hooks**: camelCase with `use` prefix (e.g., `useCodeTyping.js`, `useScrollVisibility.js`)
- **Utils**: camelCase (e.g., `syntaxHighlighter.js`, `formatDate.js`)
- **Constants**: camelCase (e.g., `editor.js`, `theme.js`)


---

## 2. Component Architecture

### Single Responsibility Principle

Each component should have ONE clear purpose:

**✅ GOOD:**
```javascript
// CodeDisplay.js - Only renders code with syntax highlighting
export default function CodeDisplay({ activeFile }) {
  const content = getFileContent(activeFile);
  const highlighted = useMemo(() => highlightCode(content), [content]);
  return <div>{highlighted}</div>;
}

// EditorTabs.js - Only manages tab UI
export default function EditorTabs({ openFiles, activeFile, onFileClick }) {
  return (
    <div className="tabs">
      {openFiles.map(file => (
        <Tab key={file} active={file === activeFile} onClick={() => onFileClick(file)} />
      ))}
    </div>
  );
}
```

**❌ BAD:**
```javascript
// EditorArea.js - Doing too much!
export default function EditorArea() {
  // Managing tabs
  const [openFiles, setOpenFiles] = useState([]);
  // Managing code display
  const [displayedCode, setDisplayedCode] = useState('');
  // Managing syntax highlighting
  const highlighted = highlightCode(displayedCode);
  // Managing file operations
  const handleFileOpen = () => { /* ... */ };
  
  return (
    <div>
      {/* Tabs UI */}
      {/* Code display */}
      {/* File operations */}
    </div>
  );
}
```

### Component Size Guidelines

- **Small components**: < 100 lines (ideal)
- **Medium components**: 100-200 lines (acceptable)
- **Large components**: > 200 lines (consider splitting)

### Component Organization Pattern

```javascript
'use client'; // Next.js directive (if needed)

// 1. Imports
import { useState, useEffect, useCallback } from 'react';
import { ExternalIcon } from 'lucide-react';
import ChildComponent from './ChildComponent';
import { CONSTANTS } from '@/lib/constants';

// 2. Constants (component-specific)
const LOCAL_CONSTANT = 'value';

// 3. Helper functions (if small and component-specific)
function helperFunction(data) {
  return data.transform();
}

// 4. Main component
export default function MyComponent({ prop1, prop2 }) {
  // 4a. Hooks (ALL hooks at the top, before any conditional logic)
  const [state, setState] = useState(initialValue);
  const ref = useRef(null);
  
  // 4b. Derived values
  const computedValue = useMemo(() => expensiveCalculation(state), [state]);
  
  // 4c. Event handlers
  const handleClick = useCallback(() => {
    // handler logic
  }, [dependencies]);
  
  // 4d. Effects
  useEffect(() => {
    // effect logic
    return () => {
      // cleanup
    };
  }, [dependencies]);
  
  // 4e. Conditional returns (AFTER all hooks)
  if (error) return <ErrorDisplay error={error} />;
  if (loading) return <LoadingSpinner />;
  
  // 4f. Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```


---

## 3. React Hooks Rules & Best Practices

### Critical Rule: Hooks Must Be Called Unconditionally

**❌ WRONG - Hooks called conditionally:**
```javascript
export default function Component({ videoId }) {
  // Early return BEFORE hooks - BREAKS REACT!
  if (!videoId) {
    return <div>No video</div>;
  }
  
  // These hooks won't be called if videoId is falsy
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
}
```

**✅ CORRECT - All hooks at the top:**
```javascript
export default function Component({ videoId }) {
  // ALL hooks first, before any conditional logic
  const [error, setError] = useState(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // THEN validation
  const isValid = videoId && typeof videoId === 'string';
  
  // Conditional returns AFTER all hooks
  if (!isValid) {
    return <div>No video</div>;
  }
  
  // Rest of component...
}
```

### useState vs useRef: When to Use Each

**Use `useState` when:**
- The value change should trigger a re-render
- The value is displayed in the UI
- Other components need to react to the change

```javascript
const [activeFile, setActiveFile] = useState('README.md'); // UI needs to update
const [isOpen, setIsOpen] = useState(false); // Modal visibility
```

**Use `useRef` when:**
- The value needs to persist but shouldn't trigger re-renders
- Storing DOM references
- Storing mutable values that don't affect rendering
- Storing previous values for comparison

```javascript
const playerRef = useRef(null); // DOM reference
const fileProgressRef = useRef({}); // Mutable data that doesn't affect UI
const previousValueRef = useRef(value); // For comparison
```

### useMemo: For Expensive Calculations

**Use `useMemo` when:**
- The calculation is computationally expensive
- The calculation result is used in rendering
- The calculation depends on specific values

```javascript
// ✅ GOOD - Expensive syntax highlighting
const highlightedLines = useMemo(() => {
  return displayedText.split('\n').map(line => highlightCode(line));
}, [displayedText]); // Only recalculate when displayedText changes

// ❌ BAD - Premature optimization
const sum = useMemo(() => a + b, [a, b]); // Simple calculation, no need for useMemo
```

### useCallback: For Event Handlers

**Use `useCallback` when:**
- Passing functions as props to child components
- The function is used as a dependency in useEffect
- Preventing unnecessary child re-renders

```javascript
// ✅ GOOD - Prevents child re-renders
const handleFileClick = useCallback((fileName) => {
  setActiveFile(fileName);
  if (!openFiles.includes(fileName)) {
    setOpenFiles(prev => [...prev, fileName]);
  }
}, [openFiles]); // Only recreate when openFiles changes

// Pass to child component
<Explorer onFileClick={handleFileClick} />
```

### useEffect: Cleanup is Critical

**Always clean up side effects:**

```javascript
useEffect(() => {
  // Setup
  const timeout = setTimeout(() => {
    // do something
  }, 1000);
  
  window.addEventListener('keydown', handleKeyPress);
  
  // Cleanup function
  return () => {
    clearTimeout(timeout);
    window.removeEventListener('keydown', handleKeyPress);
  };
}, [dependencies]);
```

**Common cleanup scenarios:**
- Timers: `clearTimeout`, `clearInterval`
- Event listeners: `removeEventListener`
- Subscriptions: `unsubscribe()`
- External scripts: `script.remove()`, `player.destroy()`
- Async operations: Cancel pending requests


---

## 4. State Management

### Lift State Up Pattern

**Rule:** State should live in the lowest common ancestor of components that need it.

```javascript
// ✅ GOOD - State in common ancestor
export default function VSCodeLayout() {
  // State lives here because both Explorer and EditorArea need it
  const [activeFile, setActiveFile] = useState('README.md');
  const [openFiles, setOpenFiles] = useState(['README.md']);
  
  const handleFileClick = (fileName) => {
    setActiveFile(fileName);
    if (!openFiles.includes(fileName)) {
      setOpenFiles([...openFiles, fileName]);
    }
  };
  
  return (
    <>
      <Explorer 
        onFileClick={handleFileClick} 
        activeFile={activeFile} 
      />
      <EditorArea 
        activeFile={activeFile}
        openFiles={openFiles}
        onFileClick={setActiveFile}
      />
    </>
  );
}
```

### Prop Drilling is OK (for shallow hierarchies)

For 2-3 levels of nesting, prop drilling is acceptable and clearer than Context API:

```javascript
// ✅ ACCEPTABLE - Only 2 levels deep
<Parent>
  <Child onAction={handleAction} data={data}>
    <GrandChild onAction={handleAction} data={data} />
  </Child>
</Parent>
```

**When to use Context API:**
- 4+ levels of nesting
- Many components need the same data
- Theme, authentication, or global settings

### Avoid Prop Drilling with Composition

```javascript
// ✅ BETTER - Use composition instead of drilling
export default function Parent() {
  const [data, setData] = useState(initialData);
  
  return (
    <Layout>
      <Sidebar />
      <Content>
        {/* Pass component with data already bound */}
        <DeepChild data={data} onChange={setData} />
      </Content>
    </Layout>
  );
}
```

### State Update Patterns

**Use functional updates when new state depends on old state:**

```javascript
// ✅ GOOD - Functional update
setOpenFiles(prev => [...prev, newFile]);
setCount(prev => prev + 1);

// ❌ BAD - Direct reference (can cause stale closure issues)
setOpenFiles([...openFiles, newFile]);
setCount(count + 1);
```

### Multi-Tab Data Management Pattern

**Problem:** When a page has multiple tabs (e.g., Consumption, Generation, Net Energy) and a shared filter (e.g., date range), changing the filter should update data for ALL tabs, not just the currently active one.

**Common Issue:**
```javascript
// ❌ BAD - Only loads data for active tab
const handleApplyFilter = async () => {
  switch (activeTab) {
    case 'CONSUMPTION':
      await loadConsumptionData(dateFrom, dateTo);
      break;
    case 'GENERATION':
      await loadGenerationData(dateFrom, dateTo);
      break;
  }
};

// When user switches tabs, old data is still cached
useEffect(() => {
  if (!consumptionData) {  // Won't reload if old data exists
    loadConsumptionData(dateFrom, dateTo);
  }
}, [activeTab]);
```

**Result:** User changes date filter → clicks Apply → switches to another tab → sees OLD data (because it was cached from previous date range).

**Solution: Clear All Cached Data When Filter Changes**

```javascript
// ✅ GOOD - Clear all data first, then load current tab
const handleApplyFilter = async () => {
  if (!dateFrom || !dateTo) return;
  
  try {
    // Step 1: Clear ALL cached data to force reload
    clearData(); // Clears consumption, generation, net energy, etc.
    
    // Step 2: Load data for current active tab
    switch (activeTab) {
      case 'CONSUMPTION':
        await loadConsumptionData(dateFrom, dateTo);
        break;
      case 'GENERATION':
        await loadGenerationData(dateFrom, dateTo);
        break;
      case 'NET_ENERGY':
        await loadNetEnergyData(dateFrom, dateTo);
        break;
    }
  } catch (err) {
    console.error('Error loading data:', err);
  }
};

// When user switches tabs, data is null so it will reload
useEffect(() => {
  if (!dateFrom || !dateTo) return;
  
  const loadDataForTab = async () => {
    switch (activeTab) {
      case 'CONSUMPTION':
        if (!consumptionData) {  // Data is null, so it loads
          await loadConsumptionData(dateFrom, dateTo);
        }
        break;
      case 'GENERATION':
        if (!generationData) {  // Data is null, so it loads
          await loadGenerationData(dateFrom, dateTo);
        }
        break;
      case 'NET_ENERGY':
        if (!netEnergyData) {  // Data is null, so it loads
          await loadNetEnergyData(dateFrom, dateTo);
        }
        break;
    }
  };
  
  loadDataForTab();
}, [activeTab, dateFrom, dateTo]);
```

**Custom Hook Pattern:**

```javascript
// useElectricityData.js
export const useElectricityData = () => {
  const [consumptionData, setConsumptionData] = useState(null);
  const [generationData, setGenerationData] = useState(null);
  const [netEnergyData, setNetEnergyData] = useState(null);
  
  const loadConsumptionData = useCallback(async (dateFrom, dateTo) => {
    // Load and set consumption data
  }, []);
  
  const loadGenerationData = useCallback(async (dateFrom, dateTo) => {
    // Load and set generation data
  }, []);
  
  const loadNetEnergyData = useCallback(async (dateFrom, dateTo) => {
    // Load and set net energy data
  }, []);
  
  // ✅ CRITICAL - Provide clearData function
  const clearData = useCallback(() => {
    setConsumptionData(null);
    setGenerationData(null);
    setNetEnergyData(null);
  }, []);
  
  return {
    consumptionData,
    generationData,
    netEnergyData,
    loadConsumptionData,
    loadGenerationData,
    loadNetEnergyData,
    clearData  // Export this!
  };
};
```

**Key Benefits:**
1. **Consistency**: All tabs always show data for the same date range
2. **No Stale Data**: Prevents showing old data when switching tabs
3. **Lazy Loading**: Only loads data when tab is actually viewed
4. **Performance**: Doesn't load all tabs at once (only current + on-demand)

**When to Use This Pattern:**
- Multi-tab interfaces with shared filters
- Dashboard pages with multiple views
- Report pages with different data breakdowns
- Any scenario where filter changes should affect all views


---

## 5. Code Quality & Defensive Programming

### Centralize Configuration - Eliminate Magic Numbers/Strings

**❌ BAD - Magic numbers scattered everywhere:**
```javascript
// In Component A
<div style={{ height: '350px' }}>

// In Component B
if (scrollTop > 350) {

// In Component C
const threshold = 350;
```

**✅ GOOD - Centralized constants:**
```javascript
// lib/constants/editor.js
export const TERMINAL_CONFIG = {
  VIDEO_HEIGHT: 300,
  SCROLL_THRESHOLD: 350,
  VISIBILITY_THRESHOLD: 0.5,
};

export const FILE_NAMES = {
  README: 'README.md',
  APP_JS: 'app.js',
  PACKAGE_JSON: 'package.json',
};

export const UI_STYLES = {
  BUTTON_HOVER: 'hover:bg-[#2a2d2e]',
  ROUNDED: 'rounded',
  TRANSITION: 'transition-colors',
};

// Usage in components
import { TERMINAL_CONFIG, FILE_NAMES, UI_STYLES } from '@/lib/constants/editor';

<div style={{ height: `${TERMINAL_CONFIG.VIDEO_HEIGHT}px` }}>
if (scrollTop > TERMINAL_CONFIG.SCROLL_THRESHOLD) {
const defaultFile = FILE_NAMES.README;
<button className={`${UI_STYLES.BUTTON_HOVER} ${UI_STYLES.ROUNDED}`}>
```

### Input Validation & Defensive Checks

**Always validate inputs:**

```javascript
// ✅ GOOD - Defensive programming
export default function VideoSearch({ onVideoSelect }) {
  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Validate and sanitize input
    const sanitizedQuery = sanitizeInput(query);
    
    if (!sanitizedQuery || sanitizedQuery.length < MIN_QUERY_LENGTH) {
      setError('Please enter a search term.');
      return;
    }
    
    // Validate callback exists
    if (typeof searchVideos !== 'function') {
      throw new Error('Search function not available');
    }
    
    const videos = await searchVideos(sanitizedQuery);
    
    // Validate response
    if (!Array.isArray(videos)) {
      throw new Error('Invalid response from search');
    }
    
    setResults(videos);
  };
}

function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .replace(/[<>]/g, ''); // Remove HTML tags
}
```

### Fallback Systems

**Build multi-level fallbacks:**

```javascript
// ✅ GOOD - Three levels of fallback
function getFileContent(fileName) {
  // Level 1: Try requested file
  if (fileContents[fileName]) {
    return fileContents[fileName];
  }
  
  // Level 2: Try fallback file
  if (fileContents[DEFAULTS.FALLBACK_FILE]) {
    return fileContents[DEFAULTS.FALLBACK_FILE];
  }
  
  // Level 3: Return error message
  return DEFAULTS.FILE_NOT_FOUND_MESSAGE;
}
```

### Null/Undefined Checks

```javascript
// ✅ GOOD - Check before accessing properties
if (folder && folder.name && expandedFolders.includes(folder.name)) {
  // Safe to access folder.files
}

// ✅ GOOD - Optional chaining
const title = video?.snippet?.title ?? 'Untitled';

// ✅ GOOD - Array checks
if (Array.isArray(results) && results.length > 0) {
  // Safe to map
}
```


---

## 6. Performance Optimization

### When to Optimize

**❌ DON'T optimize prematurely:**
```javascript
// Unnecessary optimization for simple calculation
const sum = useMemo(() => a + b, [a, b]);
```

**✅ DO optimize when there's an actual performance issue:**
- Expensive calculations (regex, string processing, data transformation)
- Large lists or frequent re-renders
- Complex component trees

### Optimization Checklist

1. **Identify the bottleneck** - Use React DevTools Profiler
2. **Measure before optimizing** - Confirm there's actually a problem
3. **Apply targeted optimization** - Don't optimize everything
4. **Measure after** - Verify the optimization worked

### Common Optimization Patterns

**1. Memoize expensive calculations:**
```javascript
// Syntax highlighting is expensive - only recalculate when text changes
const highlightedLines = useMemo(() => {
  return displayedText.split('\n').map(line => highlightCode(line));
}, [displayedText]);
```

**2. Prevent unnecessary child re-renders:**
```javascript
// Wrap event handlers in useCallback
const handleClick = useCallback((id) => {
  setSelected(id);
}, []);

// Child component won't re-render unless handleClick changes
<ChildComponent onClick={handleClick} />
```

**3. Use refs for values that don't need to trigger renders:**
```javascript
// File progress doesn't need to trigger re-renders
const fileProgressRef = useRef({});

// Update without causing re-render
fileProgressRef.current[fileName] = currentIndex;
```

**4. Lazy load components:**
```javascript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Disable server-side rendering if not needed
});
```

### Performance Anti-Patterns to Avoid

**❌ Creating functions in render:**
```javascript
// BAD - New function created on every render
<button onClick={() => handleClick(id)}>Click</button>

// BETTER - Use useCallback or bind
const handleClickWithId = useCallback(() => handleClick(id), [id]);
<button onClick={handleClickWithId}>Click</button>
```

**❌ Inline object/array creation in props:**
```javascript
// BAD - New object created on every render
<Component style={{ color: 'red' }} />

// BETTER - Define outside or use useMemo
const style = { color: 'red' };
<Component style={style} />
```


---

## 7. Error Handling

### Error Boundaries

**Create an ErrorBoundary component:**

```javascript
// components/ErrorBoundary.js
'use client';

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <CriticalComponent />
</ErrorBoundary>
```

### Try-Catch for Async Operations

```javascript
const handleSearch = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const results = await searchAPI(query);
    
    // Validate response
    if (!Array.isArray(results)) {
      throw new Error('Invalid response format');
    }
    
    setResults(results);
  } catch (err) {
    // User-friendly error message
    const message = err.message || 'Failed to search. Please try again.';
    setError(message);
    setResults([]);
  } finally {
    setLoading(false);
  }
};
```

### Graceful Degradation

```javascript
// ✅ GOOD - Fail gracefully with fallback
useEffect(() => {
  if (ytPlayerRef.current) {
    try {
      if (typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }
    } catch (err) {
      // Silently handle - not critical to user experience
      console.warn('Failed to pause video:', err);
    }
  }
}, [isVisible]);
```

### User-Friendly Error Messages

**❌ BAD - Technical error:**
```javascript
setError('TypeError: Cannot read property "data" of undefined');
```

**✅ GOOD - User-friendly error:**
```javascript
const errorMessages = {
  2: 'Invalid video ID',
  5: 'HTML5 player error',
  100: 'Video not found',
  101: 'Video not embeddable',
  150: 'Video not embeddable',
};

setError(errorMessages[event.data] || 'Error loading video. Please try again.');
```


---

## 8. API Integration

### External Script Loading Pattern

**For third-party APIs like YouTube IFrame API:**

```javascript
const loadExternalScript = useCallback((onError, onTimeout) => {
  // SSR check
  if (typeof window === 'undefined') return null;
  
  // Check if already loaded
  if (window.ExternalAPI) return null;
  
  const script = document.createElement('script');
  script.src = 'https://external-api.com/script.js';
  script.onerror = onError;
  
  const firstScript = document.getElementsByTagName('script')[0];
  firstScript.parentNode.insertBefore(script, firstScript);
  
  // Set timeout for loading
  const timeout = setTimeout(() => {
    if (!window.ExternalAPI) {
      onTimeout();
    }
  }, 10000); // 10 second timeout
  
  return timeout;
}, []);

useEffect(() => {
  let scriptTimeout;
  
  scriptTimeout = loadExternalScript(
    () => setError('Failed to load API'),
    () => setError('API loading timed out')
  );
  
  // Cleanup
  return () => {
    if (scriptTimeout) clearTimeout(scriptTimeout);
  };
}, []);
```

### API Client Pattern

**Create a centralized API client:**

```javascript
// lib/api/client.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

export const apiClient = {
  async get(endpoint, config = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        ...config,
      });
      
      if (!response.ok) {
        throw new APIError(
          'Request failed',
          response.status,
          await response.json()
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async post(endpoint, data, config = {}) {
    // Similar implementation
  },
};
```

### Environment Variables

**Always use environment variables for API keys:**

```javascript
// .env.local
NEXT_PUBLIC_YOUTUBE_API_KEY=your_key_here

// Usage
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

// Validate at runtime
if (!API_KEY) {
  throw new Error('YouTube API key not configured');
}
```


---

## 9. String Processing & HTML Safety

### CRITICAL: HTML Escaping Must Come First

**The Problem:**
When displaying user-generated content or code, HTML characters like `<`, `>`, `&` must be escaped to prevent them from being interpreted as HTML tags.

**❌ WRONG - Highlighting before escaping:**
```javascript
function highlightCode(code) {
  // BAD: Highlighting first creates nested issues
  let result = code.replace(/function/g, '<span class="keyword">function</span>');
  result = result.replace(/</g, '&lt;'); // Too late! Breaks our spans
  return result;
}
```

**✅ CORRECT - Escape first, then highlight:**
```javascript
function highlightCode(code) {
  // Step 1: Escape HTML characters FIRST
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Step 2: Now safe to add highlighting spans
  result = result.replace(/function/g, '<span class="keyword">function</span>');
  
  return result;
}
```

### Token-Based String Replacement

**For complex string processing, use placeholders to protect content:**

```javascript
export function highlightCode(code) {
  const tokens = [];
  let result = code;
  let tokenIndex = 0;
  
  // Helper to create placeholder
  const createToken = (content) => {
    const placeholder = `__TOKEN_${tokenIndex}__`;
    tokens[tokenIndex] = content;
    tokenIndex++;
    return placeholder;
  };
  
  // Step 1: Escape HTML
  result = result
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Step 2: Protect strings and comments with tokens
  result = result.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, (match) => {
    return createToken(`<span class="string">${match}</span>`);
  });
  
  result = result.replace(/\/\/.*/g, (match) => {
    return createToken(`<span class="comment">${match}</span>`);
  });
  
  // Step 3: Highlight keywords (safe because strings/comments are protected)
  result = result.replace(/\b(function|const|let|var|return)\b/g, 
    '<span class="keyword">$1</span>'
  );
  
  // Step 4: Restore tokens
  tokens.forEach((content, index) => {
    result = result.replace(`__TOKEN_${index}__`, content);
  });
  
  return result;
}
```

### Input Sanitization

**Always sanitize user input:**

```javascript
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, MAX_LENGTH) // Limit length
    .replace(/[<>]/g, ''); // Remove HTML tags
}
```


---

## 10. Date and Timezone Handling (Defensive Programming)

### The Timezone Problem

When working with dates from databases that store timestamps without timezone information, JavaScript Date objects can behave inconsistently across browsers and timezones.

**The Issue:**
```javascript
// ❌ RISKY - Browser-dependent behavior
const date = new Date('2020-11-08');

// Different browsers may interpret this as:
// - Local time: 2020-11-08 00:00:00 MST (correct)
// - UTC time: 2020-11-08 00:00:00 UTC → 2020-11-07 17:00:00 MST (WRONG - previous day!)
```

### The Solution: Add Noon Time

**✅ SAFE - Defensive programming approach:**
```javascript
// Add T12:00:00 to prevent date boundary crossing
const date = new Date('2020-11-08T12:00:00');

// Even if browser applies timezone conversion:
// 2020-11-08 12:00:00 UTC → 2020-11-08 05:00:00 MST (still same day)
```

### Why Noon Time (12:00:00)?

1. **Safety Margin**: Noon provides enough buffer that timezone conversions won't cross date boundaries
2. **Browser Compatibility**: Works consistently across all browsers
3. **Future-Proof**: If someone accesses from a different timezone, dates remain correct
4. **Defensive**: Prevents subtle bugs from timezone edge cases

### Implementation Patterns

**Pattern 1: Creating Date Objects from Strings**
```javascript
// ✅ GOOD - Add noon time when creating from date string
const dateStr = '2020-11-08';
const date = new Date(dateStr + 'T12:00:00');

// ❌ BAD - Direct creation without time
const date = new Date('2020-11-08');
```

**Pattern 2: Formatting Dates for API**
```javascript
// ✅ GOOD - Use local time methods (not UTC methods)
function formatDate(date) {
  if (!date) return null;
  
  // Check if already formatted
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Use local time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// ❌ BAD - Using UTC methods when database uses local time
function formatDate(date) {
  const year = date.getUTCFullYear();  // Wrong if DB uses local time
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

**Pattern 3: Date Pickers and User Input**
```javascript
// ✅ GOOD - Add noon time when setting default dates
useEffect(() => {
  if (dateRange && !dateFrom && !dateTo) {
    const maxDateStr = dateRange.maxDate; // e.g., "2020-11-08"
    const maxDate = new Date(maxDateStr + 'T12:00:00');
    const minDate = new Date(maxDate);
    minDate.setDate(minDate.getDate() - 7);
    
    setDateFrom(minDate);
    setDateTo(maxDate);
  }
}, [dateRange, dateFrom, dateTo]);
```

**Pattern 4: Backend Date Validation**
```javascript
// ✅ GOOD - Use string comparison instead of Date objects
const validateDateRange = (dateFrom, dateTo) => {
  const availableFrom = '2020-11-01';
  const availableTo = '2020-11-08';
  
  // String comparison avoids timezone issues
  if (dateFrom < availableFrom || dateTo > availableTo) {
    return { error: 'Date out of range' };
  }
  
  return { valid: true };
};

// ❌ BAD - Creating Date objects for comparison
const validateDateRange = (dateFrom, dateTo) => {
  const from = new Date(dateFrom);  // May shift date
  const to = new Date(dateTo);
  const availableFrom = new Date('2020-11-01');
  const availableTo = new Date('2020-11-08');
  
  if (from < availableFrom || to > availableTo) {
    return { error: 'Date out of range' };
  }
  
  return { valid: true };
};
```

### Key Principles

1. **Always use local time methods** when database stores local time:
   - ✅ `getFullYear()`, `getMonth()`, `getDate()`
   - ❌ `getUTCFullYear()`, `getUTCMonth()`, `getUTCDate()`

2. **Add T12:00:00 when creating Date objects from date strings**:
   - Prevents date boundary crossing
   - Ensures consistent behavior across browsers

3. **Use string comparison for date validation**:
   - Avoids timezone conversion issues
   - Simpler and more reliable

4. **Document timezone assumptions**:
   - Comment where dates come from (database, user input, API)
   - Note if timestamps include timezone information

### Real-World Example

```javascript
// Custom hook for loading thermal data
const useThermalData = (selectedFloor) => {
  const [selectedDate, setSelectedDate] = useState(null);
  
  useEffect(() => {
    const loadInitialData = async () => {
      const dates = await ThermalService.getAvailableDates();
      
      if (dates.length > 0) {
        // ✅ Add noon time to prevent timezone issues
        const lastDateStr = dates[dates.length - 1];
        const dateObj = new Date(lastDateStr + 'T12:00:00');
        setSelectedDate(dateObj);
        
        // Load data for that date
        const data = await ThermalService.getMultipleSensorsDailyData(
          lastDateStr,  // Send as string, not Date object
          sensorIds
        );
        setDailyData(data);
      }
    };
    
    loadInitialData();
  }, []);
  
  // Format date for API (timezone-safe)
  const loadSingleDayData = useCallback(async (date, sensorIds) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const data = await ThermalService.getMultipleSensorsDailyData(dateStr, sensorIds);
    return data;
  }, []);
};
```

### When NOT to Use This Pattern

This pattern is specifically for databases that store timestamps **without timezone information** in **local time**. 

**Don't use this pattern if:**
- Database stores timestamps with timezone (e.g., `TIMESTAMP WITH TIME ZONE`)
- Database stores timestamps in UTC
- Working with ISO 8601 strings that include timezone (e.g., `2020-11-08T12:00:00Z`)

In those cases, use proper timezone libraries like `date-fns-tz` or `luxon`.


---

## 11. Styling & UI Consistency

### Centralize UI Styles

**Create reusable style constants:**

```javascript
// lib/constants/editor.js
export const UI_STYLES = {
  // Button states
  BUTTON_HOVER: 'hover:bg-[#2a2d2e]',
  BUTTON_HOVER_BLUE: 'hover:bg-[#005a9e]',
  
  // Spacing
  PADDING_SM: 'px-2 py-1',
  PADDING_MD: 'px-3 py-2',
  PADDING_LG: 'px-4 py-3',
  
  // Transitions
  TRANSITION: 'transition-colors',
  TRANSITION_ALL: 'transition-all',
  
  // Borders
  ROUNDED: 'rounded',
  ROUNDED_LG: 'rounded-lg',
};

// Usage
<button className={`${UI_STYLES.BUTTON_HOVER} ${UI_STYLES.ROUNDED} ${UI_STYLES.PADDING_MD}`}>
  Click me
</button>
```

### Theme Colors

**Define color palette centrally:**

```javascript
export const THEME_COLORS = {
  // Background
  BG_PRIMARY: '#1e1e1e',
  BG_SECONDARY: '#252526',
  BG_HOVER: '#2a2d2e',
  
  // Text
  TEXT_PRIMARY: '#cccccc',
  TEXT_SECONDARY: '#858585',
  TEXT_WHITE: '#ffffff',
  
  // Accent
  ACCENT_BLUE: '#007acc',
  ACCENT_GREEN: '#4ec9b0',
  
  // Syntax highlighting
  SYNTAX_KEYWORD: '#569cd6',
  SYNTAX_STRING: '#ce9178',
  SYNTAX_COMMENT: '#6a9955',
  SYNTAX_FUNCTION: '#dcdcaa',
};
```

### Consistent Spacing

**Use Tailwind's spacing scale consistently:**

```javascript
// ✅ GOOD - Consistent spacing
<div className="p-4">        {/* 1rem = 16px */}
  <div className="mb-2">     {/* 0.5rem = 8px */}
    <div className="px-3">   {/* 0.75rem = 12px */}
    </div>
  </div>
</div>

// ❌ BAD - Random pixel values
<div style={{ padding: '17px' }}>
  <div style={{ marginBottom: '13px' }}>
  </div>
</div>
```


---

## 11. TypeScript Best Practices

> **Note:** All rules in this document apply to both JavaScript and TypeScript projects. This section covers TypeScript-specific additions.

### When to Use TypeScript

**✅ Use TypeScript for:**
- Medium to large projects (10+ components)
- Team projects with multiple developers
- Projects with complex data structures
- Long-term maintenance projects
- API-heavy applications

**⚠️ JavaScript is fine for:**
- Small prototypes or MVPs
- Solo projects with simple data
- Learning projects
- Quick experiments

### File Extensions

```
JavaScript → TypeScript
.js       → .ts
.jsx      → .tsx
```

### Component Props Typing

**✅ GOOD - Define prop types with interface:**
```typescript
// components/VideoPlayer.tsx
interface VideoPlayerProps {
  videoId: string;
  isVisible?: boolean;  // Optional prop
  onError?: (error: Error) => void;  // Optional callback
  playerRef?: React.RefObject<any>;
}

export default function VideoPlayer({ 
  videoId, 
  isVisible = true,  // Default value
  onError,
  playerRef 
}: VideoPlayerProps) {
  // Component logic
}
```

**❌ BAD - No types:**
```typescript
// Missing types - TypeScript won't catch errors
export default function VideoPlayer({ videoId, isVisible, onError }) {
  // ...
}
```

### State Typing

**TypeScript can often infer types, but be explicit when needed:**

```typescript
// ✅ GOOD - Type is inferred from initial value
const [count, setCount] = useState(0);  // TypeScript knows it's number
const [isOpen, setIsOpen] = useState(false);  // TypeScript knows it's boolean

// ✅ GOOD - Explicit type when initial value is null
const [user, setUser] = useState<User | null>(null);
const [data, setData] = useState<ApiResponse | null>(null);

// ✅ GOOD - Array with specific type
const [items, setItems] = useState<string[]>([]);
const [users, setUsers] = useState<User[]>([]);

// ❌ BAD - Using 'any' defeats the purpose of TypeScript
const [data, setData] = useState<any>(null);
```

### Event Handler Typing

```typescript
// ✅ GOOD - Properly typed event handlers
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  // ...
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};

const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (e.key === 'Enter') {
    // ...
  }
};
```

### Custom Hook Typing

```typescript
// ✅ GOOD - Typed custom hook
interface UseCodeTypingReturn {
  displayedText: string;
  currentIndex: number;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  resetProgress: () => void;
}

function useCodeTyping(fileName: string): UseCodeTypingReturn {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    // ...
  }, []);
  
  const resetProgress = useCallback(() => {
    // ...
  }, []);
  
  return {
    displayedText,
    currentIndex,
    handleKeyPress,
    resetProgress,
  };
}
```

### API Response Typing

**Define types for API responses:**

```typescript
// lib/types/api.ts
export interface VideoSearchResult {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  description: string;
}

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

// lib/youtube/api.ts
export const searchVideos = async (
  query: string, 
  maxResults: number = 10
): Promise<VideoSearchResult[]> => {
  try {
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search videos');
    }
    
    const data = await response.json();
    return data.items.map((item: any): VideoSearchResult => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
    }));
  } catch (error) {
    console.error('Error searching videos:', error);
    return [];
  }
};
```

### Constants Typing

```typescript
// lib/constants/editor.ts
export const TERMINAL_CONFIG = {
  VIDEO_HEIGHT: 300,
  SCROLL_THRESHOLD: 350,
  VISIBILITY_THRESHOLD: 0.5,
} as const;  // 'as const' makes it readonly

export const FILE_NAMES = {
  README: 'README.md',
  APP_JS: 'app.js',
  PACKAGE_JSON: 'package.json',
} as const;

// Type-safe usage
type FileName = typeof FILE_NAMES[keyof typeof FILE_NAMES];
// FileName = 'README.md' | 'app.js' | 'package.json'
```

### Utility Function Typing

```typescript
// ✅ GOOD - Typed utility functions
export function sanitizeInput(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, MAX_QUERY_LENGTH)
    .replace(/[<>]/g, '');
}

export function getFileContent(fileName: string): string {
  const content = fileContents[fileName];
  
  if (content) return content;
  if (fileContents[DEFAULTS.FALLBACK_FILE]) {
    return fileContents[DEFAULTS.FALLBACK_FILE];
  }
  
  return DEFAULTS.FILE_NOT_FOUND_MESSAGE;
}

// Generic utility function
export function groupBy<T>(
  array: T[], 
  keyFn: (item: T) => string
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const key = keyFn(item);
    (result[key] = result[key] || []).push(item);
    return result;
  }, {} as Record<string, T[]>);
}
```

### Avoid 'any' - Use Proper Types

**❌ BAD - Using 'any' everywhere:**
```typescript
function processData(data: any): any {
  return data.map((item: any) => item.value);
}
```

**✅ GOOD - Proper types:**
```typescript
interface DataItem {
  id: string;
  value: number;
}

function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

**✅ ACCEPTABLE - Use 'unknown' when type is truly unknown:**
```typescript
function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Type Guards

```typescript
// ✅ GOOD - Type guards for runtime checks
function isVideoSearchResult(obj: any): obj is VideoSearchResult {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.thumbnail === 'string'
  );
}

// Usage
const data = await fetchData();
if (isVideoSearchResult(data)) {
  // TypeScript knows data is VideoSearchResult here
  console.log(data.title);
}
```

### Discriminated Unions for State

```typescript
// ✅ GOOD - Discriminated union for loading states
type DataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function DataDisplay() {
  const [state, setState] = useState<DataState<User>>({ status: 'idle' });
  
  // TypeScript enforces exhaustive checking
  switch (state.status) {
    case 'idle':
      return <div>Click to load</div>;
    case 'loading':
      return <LoadingSpinner />;
    case 'success':
      return <div>{state.data.name}</div>;  // data is available
    case 'error':
      return <div>{state.error.message}</div>;  // error is available
  }
}
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,  // Enable all strict type checking
    "noUncheckedIndexedAccess": true,  // Safer array access
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Migration from JavaScript to TypeScript

**Step-by-step approach:**

1. **Start with tsconfig.json** - Add TypeScript configuration
2. **Rename files gradually** - `.js` → `.ts`, `.jsx` → `.tsx`
3. **Add types incrementally** - Start with simple components
4. **Use `// @ts-ignore` sparingly** - Only for temporary fixes
5. **Fix errors one by one** - Don't try to fix everything at once

**Example migration:**

```typescript
// Before (JavaScript)
export default function Button({ children, onClick, variant, disabled }) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// After (TypeScript)
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false 
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### TypeScript Quick Reference

**Common React + TypeScript patterns:**

```typescript
// Props with children
interface Props {
  children: React.ReactNode;
}

// Optional props
interface Props {
  title?: string;
  onClose?: () => void;
}

// Union types
type Status = 'idle' | 'loading' | 'success' | 'error';

// Ref typing
const inputRef = useRef<HTMLInputElement>(null);
const divRef = useRef<HTMLDivElement>(null);

// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <div>{items.map(renderItem)}</div>;
}
```

---

## 12. Testing Strategy

### What to Test

**Priority 1 - Critical Business Logic:**
- Complex utility functions (e.g., syntax highlighter with 145 lines)
- Custom hooks with state management
- Data transformation functions
- API error handling scenarios

**Priority 2 - User Interactions:**
- Form submissions
- Button clicks
- Navigation flows
- Error states

**Priority 3 - Edge Cases:**
- Empty inputs
- Invalid data
- Network failures
- Boundary conditions

### Testing Pattern

```javascript
// utils/syntaxHighlighter.test.js
import { highlightCode } from './syntaxHighlighter';

describe('highlightCode', () => {
  it('should escape HTML characters', () => {
    const code = '<script>alert("xss")</script>';
    const result = highlightCode(code);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
  
  it('should highlight keywords', () => {
    const code = 'function test() { return true; }';
    const result = highlightCode(code);
    expect(result).toContain('<span class="keyword">function</span>');
    expect(result).toContain('<span class="keyword">return</span>');
  });
  
  it('should handle empty input', () => {
    expect(highlightCode('')).toBe('');
    expect(highlightCode(null)).toBe('');
  });
});
```

### Custom Hook Testing

```javascript
// hooks/useCodeTyping.test.js
import { renderHook, act } from '@testing-library/react';
import { useCodeTyping } from './useCodeTyping';

describe('useCodeTyping', () => {
  it('should preserve file progress when switching files', () => {
    const { result } = renderHook(() => useCodeTyping('file1.js'));
    
    // Type some characters
    act(() => {
      result.current.handleKeyPress({ key: 'a' });
      result.current.handleKeyPress({ key: 'b' });
    });
    
    // Switch to another file
    act(() => {
      result.current.setActiveFile('file2.js');
    });
    
    // Switch back
    act(() => {
      result.current.setActiveFile('file1.js');
    });
    
    // Progress should be preserved
    expect(result.current.currentIndex).toBe(2);
  });
});
```

### When to Write Tests

**✅ Write tests BEFORE refactoring:**
- Tests act as a safety net
- Catch regressions immediately
- Make refactoring safer

**✅ Write tests for bug fixes:**
- Reproduce the bug in a test
- Fix the bug
- Test ensures it doesn't come back

**❌ Don't write tests just for coverage:**
- Focus on valuable tests
- Test behavior, not implementation


---

## 13. Common Pitfalls & Solutions

### Pitfall 1: Stale Closures in useEffect

**Problem:**
```javascript
// ❌ BAD - count is stale in the interval
const [count, setCount] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setCount(count + 1); // Always uses initial count value!
  }, 1000);
  
  return () => clearInterval(interval);
}, []); // Empty deps means count is captured once
```

**Solution:**
```javascript
// ✅ GOOD - Use functional update
useEffect(() => {
  const interval = setInterval(() => {
    setCount(prev => prev + 1); // Always uses current value
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

### Pitfall 2: Missing Cleanup in useEffect

**Problem:**
```javascript
// ❌ BAD - Memory leak!
useEffect(() => {
  window.addEventListener('keydown', handleKeyPress);
  // No cleanup!
}, []);
```

**Solution:**
```javascript
// ✅ GOOD - Always clean up
useEffect(() => {
  window.addEventListener('keydown', handleKeyPress);
  
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, [handleKeyPress]);
```

### Pitfall 3: Unnecessary Re-renders

**Problem:**
```javascript
// ❌ BAD - New function created on every render
function Parent() {
  const handleClick = (id) => {
    console.log(id);
  };
  
  return <Child onClick={handleClick} />; // Child re-renders every time
}
```

**Solution:**
```javascript
// ✅ GOOD - Memoize the function
function Parent() {
  const handleClick = useCallback((id) => {
    console.log(id);
  }, []);
  
  return <Child onClick={handleClick} />; // Child only re-renders when needed
}
```

### Pitfall 4: Mutating State Directly

**Problem:**
```javascript
// ❌ BAD - Mutating state directly
const [items, setItems] = useState([1, 2, 3]);

const addItem = () => {
  items.push(4); // Mutation!
  setItems(items); // React won't detect the change
};
```

**Solution:**
```javascript
// ✅ GOOD - Create new array
const addItem = () => {
  setItems([...items, 4]); // New array
};

// Or use functional update
const addItem = () => {
  setItems(prev => [...prev, 4]);
};
```

### Pitfall 5: Not Handling Loading/Error States

**Problem:**
```javascript
// ❌ BAD - No loading or error handling
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(setData);
}, []);

return <div>{data.value}</div>; // Crashes if data is null!
```

**Solution:**
```javascript
// ✅ GOOD - Handle all states
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetch('/api/data')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <div>{data.value}</div>;
```


---

## Quick Reference Checklist

### Before Writing a Component

- [ ] Does this component have a single, clear responsibility?
- [ ] Is it small enough (< 200 lines)?
- [ ] Are all hooks at the top, before any conditional logic?
- [ ] Do I need state or refs for this data?

### Before Committing Code

- [ ] No magic numbers or strings (use constants)
- [ ] All inputs validated and sanitized
- [ ] Error handling in place (try-catch, error boundaries)
- [ ] Cleanup functions in all useEffects
- [ ] No console.logs left in production code
- [ ] Loading and error states handled
- [ ] Accessibility attributes added (aria-label, etc.)

### Performance Checklist

- [ ] Used useMemo for expensive calculations?
- [ ] Used useCallback for event handlers passed to children?
- [ ] Used refs for values that don't need to trigger renders?
- [ ] Avoided creating functions/objects in render?
- [ ] Lazy loaded heavy components?

### Code Quality Checklist

- [ ] Meaningful variable and function names
- [ ] Comments explain "why", not "what"
- [ ] Consistent code formatting
- [ ] No duplicate code (DRY principle)
- [ ] Defensive programming (null checks, fallbacks)
- [ ] User-friendly error messages

---

## Key Takeaways

1. **Hooks must be called unconditionally** - All hooks at the top, before any returns
2. **Centralize configuration** - No magic numbers or strings
3. **Defensive programming** - Validate inputs, check for null, provide fallbacks
4. **Clean up side effects** - Always return cleanup functions in useEffect
5. **Optimize strategically** - Only optimize when there's an actual performance issue
6. **HTML escaping comes first** - Escape before any HTML generation
7. **Test critical logic** - Focus on business logic and complex functions
8. **Single responsibility** - Each component/function does one thing well
9. **State management** - Lift state to lowest common ancestor
10. **Error handling** - Handle loading, error, and empty states

---

## Resources

- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [Tailwind CSS](https://tailwindcss.com/)
- [VS Code Ninja Project](https://github.com/Xujun-Wang/cprg306final) - Reference implementation

---

**Last Updated:** December 2025  
**Based on:** VS Code Ninja project (CPRG306 - Web Development 2)  
**Author:** Xujun Wang  
**Language Support:** JavaScript & TypeScript

