"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Upload, Youtube, BookOpen } from 'lucide-react';
import { Alert, AlertTitle } from '@/components/ui/alert';

// Define more specific types to avoid 'any'
interface MarkedRenderer {
  text: (text: string) => string;
  paragraph: (text: string) => string;
}

interface MarkedOptions {
  renderer: MarkedRenderer;
  gfm: boolean;
  breaks: boolean;
  tables: boolean;
  smartLists: boolean;
  smartypants: boolean;
  headerIds: boolean;
  mangle: boolean;
}

interface AlertType {
  message: string;
  type: 'error' | 'success' | 'info' | 'warning';
}

interface KatexOptions {
  delimiters: Array<{ left: string; right: string; display: boolean }>;
  throwOnError: boolean;
}

const scripts = [
  'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.2/marked.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js'
];

const styles = [
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css'
];

declare global {
  interface Window {
    marked: {
      parse: (text: string) => string;
      setOptions: (options: MarkedOptions) => void;
      Renderer: new () => MarkedRenderer;
    };
    DOMPurify: {
      sanitize: (html: string, options?: Record<string, unknown>) => string;
    };
    katex: unknown;
    renderMathInElement: (element: HTMLElement, options: KatexOptions) => void;
  }
}

const MarkdownEditor: React.FC = () => {
  const [markdown, setMarkdown] = useState<string>('');
  const [html, setHtml] = useState<string>('');
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [librariesLoaded, setLibrariesLoaded] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialMarkdown = `# Markdown Editor Examples

## Basic Markdown Features

### Headers & Text Styling
# H1 Header
## H2 Header
### H3 Header
#### H4 Header

*Italic text* and **bold text**
***Bold and italic text***

### Lists
1. Ordered list item 1
2. Ordered list item 2
   - Nested unordered item
   - Another nested item
3. Ordered list item 3

- Unordered list
- Another item
  1. Nested ordered item
  2. Another nested item

### Code
Inline \`code\` example

\`\`\`javascript
// Code block example
function hello() {
  console.log("Hello, world!");
}
\`\`\`

### Links and Images
[Link to example](https://example.com)
![Placeholder Image](https://via.placeholder.com/150)

### Tables
| Feature | Status | Notes |
|---------|--------|-------|
| Basic Markdown | ✅ | Core features |
| Extended Features | ✅ | Additional functionality |
| Custom Styles | ✅ | Using Tailwind |

## Extended Features

### Mathematical Expressions
Inline math: $E = mc^2$

Block math:
$$
\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

Complex equation:
$$
\\begin{aligned}
\\nabla \\times \\vec{\\mathbf{B}} &= \\frac{1}{c}\\frac{\\partial\\vec{\\mathbf{E}}}{\\partial t} + \\frac{4\\pi}{c}\\vec{\\mathbf{j}} \\\\
\\nabla \\cdot \\vec{\\mathbf{E}} &= 4 \\pi \\rho \\\\
\\nabla \\times \\vec{\\mathbf{E}}&= -\\frac{1}{c}\\frac{\\partial\\vec{\\mathbf{B}}}{\\partial t} \\\\
\\nabla \\cdot \\vec{\\mathbf{B}} &= 0 
\\end{aligned}
$$

### Task Lists
- [x] Basic Markdown
- [x] Math Support
- [x] Footnotes
- [x] Subscripts
- [ ] Future features

> **Note**: You can combine any of these features together!
`;

  // Load scripts and styles
  useEffect(() => {
    // Load scripts
    const loadedScripts = scripts.map(src => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      return new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    });

    // Load styles
    styles.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });

    // Wait for all scripts to load
    Promise.all(loadedScripts)
      .then(() => {
        const checkLibraries = setInterval(() => {
          if (window.marked && window.DOMPurify && window.katex) {
            setLibrariesLoaded(true);
            clearInterval(checkLibraries);
            setMarkdown(initialMarkdown);
          }
        }, 100);

        return () => clearInterval(checkLibraries);
      })
      .catch(error => {
        console.error('Error loading libraries:', error);
      });
  }, [initialMarkdown]);

  // Configure marked with custom renderer
  useEffect(() => {
    if (librariesLoaded) {
      const renderer = new window.marked.Renderer();

      /* eslint-disable @typescript-eslint/no-unused-vars */
      renderer.text = (text: string): string => {
        text = text.replace(/~([^~]+)~/g, (_match: string, p1: string) => `<sub>${p1}</sub>`);
        text = text.replace(/\^([^\^]+)\^/g, (_match: string, p1: string) => `<sup>${p1}</sup>`);
        return text;
      };

      let footnoteIndex = 1;

      renderer.paragraph = (text: string): string => {
        text = text.replace(/\[\^([^\]]+)\]/g, (_match: string, _id: string) => {
          const currentIndex = footnoteIndex;
          footnoteIndex++;
          return `<sup class="footnote-ref"><a href="#fn${currentIndex}">${currentIndex}</a></sup>`;
        });
        return `<p>${text}</p>`;
      };
      /* eslint-enable @typescript-eslint/no-unused-vars */

      window.marked.setOptions({
        renderer: renderer,
        gfm: true,
        breaks: true,
        tables: true,
        smartLists: true,
        smartypants: true,
        headerIds: true,
        mangle: false
      });
    }
  }, [librariesLoaded]);

  // Convert markdown to HTML with math support
  useEffect(() => {
    if (librariesLoaded && markdown) {
      try {
        const rawHtml = window.marked.parse(markdown);

        const cleanHtml = window.DOMPurify.sanitize(rawHtml, {
          ADD_TAGS: ['iframe', 'sub', 'sup'],
          ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling']
        });

        setHtml(cleanHtml);

        setTimeout(() => {
          const preview = document.querySelector('.preview-content') as HTMLElement;
          if (preview) {
            window.renderMathInElement(preview, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false}
              ],
              throwOnError: false
            });
          }
        }, 0);
      } catch (err) {
        console.error('Error processing markdown:', err);
        setHtml('<p>Error processing markdown</p>');
      }
    }
  }, [markdown, librariesLoaded]);

  const showAlert = (message: string, type: AlertType['type'] = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSave = () => {
    try {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.md';
      a.click();
      URL.revokeObjectURL(url);
      showAlert('Document saved successfully!', 'success');
    } catch (err) { // Changed error to err
      console.error('Error saving document:', err); // Log the error
      showAlert('Error saving document', 'error');
    }
  };

  const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
   reader.onload = (e: ProgressEvent<FileReader>) => {
  try {
    const content = e.target?.result;
    if (typeof content === 'string') {
      setMarkdown(content);
      showAlert('Document loaded successfully!', 'success');
    }
  } catch (err) { // Changed error to err
    console.error('Error loading document:', err); // Log the error
    showAlert('Error loading document', 'error');
  }
};
    
    reader.readAsText(file);
  };

  const handleLearnMarkdown = () => {
    window.open('https://www.youtube.com/watch?v=i-3ifG_ycjw', '_blank');
  };

  const handleDocumentation = () => {
    window.open('https://technicalwritingmp.com/docs/markdown-course/introduction-to-markdown/', '_blank');
  };

  if (!librariesLoaded) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div className="h-screen max-h-screen flex flex-col">
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">TWMP Advanced Markdown Editor</h1>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLearnMarkdown}
              className="text-white hover:text-slate-800"
            >
              <Youtube className="w-4 h-4 mr-2" />
              Learn Markdown
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDocumentation}
              className="text-white hover:text-slate-800"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Load
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={handleSave}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".md,.markdown,.txt"
            onChange={handleLoad}
          />
        </div>
      </div>

      {alert && (
        <div className="absolute top-16 right-4 z-50">
          <Alert className={alert.type === 'error' ? 'border-red-500' : 'border-green-500'}>
            <AlertTitle>{alert.message}</AlertTitle>
          </Alert>
        </div>
      )}
      
      <div className="flex-1 flex overflow-hidden">
        <Card className="flex-1 m-4 overflow-hidden">
          <div className="bg-slate-100 p-2 text-sm font-medium">MARKDOWN</div>
          <textarea
            className="w-full h-full p-4 resize-none focus:outline-none font-mono text-sm"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Enter your markdown here..."
          />
        </Card>

        <Card className="flex-1 m-4 overflow-hidden">
          <div className="bg-slate-100 p-2 text-sm font-medium">PREVIEW</div>
          <div 
            className="preview-content w-full h-full p-4 overflow-auto prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </Card>
      </div>
    </div>
  );
};

export default MarkdownEditor;