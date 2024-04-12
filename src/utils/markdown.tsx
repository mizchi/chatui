import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize from 'rehype-sanitize';
import rehypeReact from 'rehype-react';
import rehypeParse from 'rehype-parse';
// import { createElement, Fragment } from "react";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useRef, useState } from "react";

const rawToHtml = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSanitize)
  // .use(rehypeSanitize)
  .use(rehypePrettyCode, {
    defaultLang: 'markdown',
  })
  // @ts-ignore
  .use(rehypeReact, {
    jsx,
    jsxs,
    Fragment,
    components: {
      pre: (props: any) => {
        console.log('props', props);
        const ref = useRef<HTMLPreElement>(null);
        const [copied, setCopied] = useState(false);
        return <div style={{
          ...props.style, ...{
            position: 'relative',
          }
        }}>
          <pre {...props} ref={ref} style={{
            ...props.style, ...{
              // marginTop: 10,
              // marginBottom: 10,
              // padding: 3,
            }
          }} />
          <div style={{ position: 'absolute', right: 0, top: 0 }}>
            <button onClick={() => {
              if (ref.current === null) return;
              console.log('props.children', ref.current.textContent);
              navigator.clipboard.writeText(ref.current.textContent || '');
              setCopied(true);
            }}>[{copied ? 'Copied' : "Copy"}]</button>
          </div>
        </div>;
      },
      // a: 
    }
  });
// .use(rehypeStringify);

export async function compileMarkdown(code: string): Promise<{ result: React.ReactNode }> {
  return await rawToHtml.process(code);
}
