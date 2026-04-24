"use client";

import { useState } from 'react';
import styles from './page.module.css';

// Recursive Tree Node Component
const TreeNode = ({ nodeKey, childrenObj }) => {
  const childKeys = Object.keys(childrenObj || {});
  
  return (
    <div className={styles.nodeItem}>
      <span className={styles.nodeLabel}>{nodeKey}</span>
      {childKeys.length > 0 && (
        <ul className={styles.nodeList}>
          {childKeys.map(childKey => (
            <li key={childKey}>
              <TreeNode nodeKey={childKey} childrenObj={childrenObj[childKey]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function Home() {
  const [input, setInput] = useState('[\n  "A->B",\n  "A->C",\n  "B->D",\n  "C->E",\n  "E->F",\n  "X->Y",\n  "Y->Z",\n  "Z->X",\n  "P->Q",\n  "Q->R",\n  "G->H",\n  "G->H",\n  "G->I",\n  "hello",\n  "1->2",\n  "A->"\n]');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      // Parse input
      let parsedData;
      try {
        parsedData = JSON.parse(input);
        if (!Array.isArray(parsedData)) {
          throw new Error("Input must be a JSON array of strings.");
        }
      } catch (e) {
        throw new Error("Invalid JSON format. Please provide a valid JSON array.");
      }

      const res = await fetch('http://localhost:5000/bfhl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsedData }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "API request failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Graph Analysis Tool</h1>
        <p className={styles.subtitle}>SRM Full Stack Engineering Challenge</p>
      </div>

      <div className={styles.mainLayout}>
        {/* Left Column: Input */}
        <section>
          <div className={styles.glassCard}>
            <h2 className={styles.cardTitle}>Input Graph Edges</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Enter a JSON array of edges (e.g., "A-&gt;B").
            </p>
            <textarea
              className={styles.textarea}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='["A->B", "C->D"]'
            />
            <button 
              className={styles.submitBtn} 
              onClick={handleSubmit} 
              disabled={loading}
            >
              {loading ? <div className={styles.spinner}></div> : "Analyze Graph"}
            </button>
          </div>
        </section>

        {/* Right Column: Output */}
        <section>
          {error && (
            <div className={styles.errorMessage}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div className={styles.glassCard} style={{ animation: 'fadeIn 0.5s ease-out' }}>
              <h2 className={styles.cardTitle}>Analysis Results</h2>
              
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryValue}>{result.summary.total_trees}</div>
                  <div className={styles.summaryLabel}>Total Trees</div>
                </div>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryValue}>{result.summary.total_cycles}</div>
                  <div className={styles.summaryLabel}>Total Cycles</div>
                </div>
                <div className={styles.summaryItem}>
                  <div className={styles.summaryValue}>{result.summary.largest_tree_root || 'N/A'}</div>
                  <div className={styles.summaryLabel}>Largest Root</div>
                </div>
              </div>

              {(result.invalid_entries.length > 0 || result.duplicate_edges.length > 0) && (
                <div className={styles.listsGrid}>
                  {result.invalid_entries.length > 0 && (
                    <div className={styles.listCard}>
                      <h4>Invalid Entries</h4>
                      <div className={styles.tagList}>
                        {result.invalid_entries.map((item, i) => (
                          <span key={`inv-${i}`} className={`${styles.tag} ${styles.invalid}`}>
                            {item === '' ? '(empty string)' : item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.duplicate_edges.length > 0 && (
                    <div className={styles.listCard}>
                      <h4>Duplicate Edges</h4>
                      <div className={styles.tagList}>
                        {result.duplicate_edges.map((item, i) => (
                          <span key={`dup-${i}`} className={`${styles.tag} ${styles.duplicate}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.treeContainer}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#cbd5e1' }}>Hierarchies</h3>
                
                {result.hierarchies.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No hierarchies formed.</p>
                ) : (
                  result.hierarchies.map((hier, index) => (
                    <div key={index} className={styles.treeItem}>
                      <div className={styles.treeHeader}>
                        <div className={styles.treeRoot}>
                          <span className={styles.treeRootBadge}>{hier.root}</span>
                          {hier.has_cycle ? "Cycle detected" : "Tree"}
                        </div>
                        <div className={styles.treeMeta}>
                          {hier.depth && <span>Depth: {hier.depth}</span>}
                        </div>
                      </div>
                      <div className={styles.treeBody}>
                        {hier.has_cycle ? (
                          <div className={styles.cycleWarning}>
                            ⚠️ This group contains a pure cycle or cyclic dependencies.
                          </div>
                        ) : (
                          <ul className={styles.nodeList} style={{ borderLeft: 'none', marginLeft: 0, paddingLeft: 0 }}>
                            <li>
                              <TreeNode nodeKey={hier.root} childrenObj={hier.tree[hier.root]} />
                            </li>
                          </ul>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
                ID: {result.user_id} | Roll: {result.college_roll_number}
              </div>

            </div>
          )}
          
          {!result && !error && (
            <div className={styles.glassCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#64748b' }}>
              <p>Submit data to see results here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
