import { makeCx } from '../../lib/cx';
import styles from '../../styles/waterQuality.module.css';
import PublicNavbar from './PublicNavbar';

const cx = makeCx(styles);

/** Downloads the lab results table as a text report. */
function downloadReport() {
  const table = document.querySelector('[data-lab-table]');
  const rows = ['AquaPro Water Quality Laboratory Report'];
  for (const tr of table.rows) {
    rows.push(Array.from(tr.cells, (cell) => cell.textContent.trim()).join(' | '));
  }
  const url = URL.createObjectURL(new Blob([rows.join('\r\n')], { type: 'text/plain' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'aquapro-water-quality-report.txt';
  link.click();
  URL.revokeObjectURL(url);
}

export default function WaterQualityPage() {
  return (
    <>
      <PublicNavbar cx={cx} variant="water-quality" />
      {/* Hero */}
      <section className={cx("quality-hero")}>
        <div className={cx("container")}>
          <h1>Our Water Quality Promise</h1>
          <p>
            At AquaPro, we are committed to providing the safest, cleanest drinking water to every household in Catarman, Northern Samar. Our water undergoes rigorous filtration and regular testing to ensure it meets the highest standards.
          </p>
            </div>
      </section>
      {/* Filtration Process */}
      <section className={cx("filtration-process")}>
        <div className={cx("container")}>
          <h2 className={cx("section-title")}>Our Filtration Process</h2>
          <p className={cx("section-subtitle")}>Every drop goes through a 4-stage purification system</p>
          <div className={cx("process-flow")}>
            <div className={cx("process-step")}>
              <div className={cx("step-icon")}>
                <i className={cx("fas fa-filter")}></i>
              </div>
              <h3>Sediment Filtration</h3>
              <p>Removes large particles like sand, dirt, rust, and other suspended solids</p>
            </div>
            <div className={cx("process-arrow")}>
              <i className={cx("fas fa-arrow-right")}></i>
            </div>
            <div className={cx("process-step")}>
              <div className={cx("step-icon")}>
                <i className={cx("fas fa-fire")}></i>
              </div>
              <h3>Carbon Filtration</h3>
              <p>Eliminates chlorine, organic compounds, bad taste, and unpleasant odors</p>
            </div>
            <div className={cx("process-arrow")}>
              <i className={cx("fas fa-arrow-right")}></i>
            </div>
            <div className={cx("process-step")}>
              <div className={cx("step-icon")}>
                <i className={cx("fas fa-microscope")}></i>
              </div>
              <h3>Reverse Osmosis</h3>
              <p>Removes up to 99% of dissolved salts, bacteria, and heavy metals</p>
            </div>
            <div className={cx("process-arrow")}>
              <i className={cx("fas fa-arrow-right")}></i>
            </div>
            <div className={cx("process-step")}>
              <div className={cx("step-icon")}>
                <i className={cx("fas fa-sun")}></i>
              </div>
              <h3>UV Sterilization</h3>
              <p>Eliminates any remaining microorganisms for absolute purity</p>
            </div>
          </div>
            </div>
      </section>
      {/* Lab Results */}
      <section className={cx("lab-results")}>
        <div className={cx("container")}>
          <h2 className={cx("section-title")}>Latest Laboratory Test Results</h2>
          <p className={cx("section-subtitle")}>Tested on March 15, 2024 | Certificate #: WQ-2024-0315-001</p>
          <div className={cx("table-container")}>
        <table className={cx("lab-table")} data-lab-table>
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Result</th>
                  <th>Acceptable Standard</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>pH Level</td>
                  <td>7.2</td>
                  <td>6.5 - 8.5</td>
                  <td>
                    <span className={cx("badge badge-pass")}>Passed</span>
                  </td>
                </tr>
                <tr>
                  <td>Total Dissolved Solids (TDS)</td>
                  <td>85 mg/L</td>
                  <td>&lt; 500 mg/L</td>
                  <td>
                    <span className={cx("badge badge-pass")}>Passed</span>
                  </td>
                </tr>
                <tr>
                  <td>Total Coliform</td>
                  <td>&lt; 1.1 MPN/100mL</td>
                  <td>&lt; 1.1 MPN/100mL</td>
                  <td>
                    <span className={cx("badge badge-pass")}>Passed</span>
                  </td>
                </tr>
                <tr>
                  <td>E. coli</td>
                  <td>Not Detected</td>
                  <td>Not Detected</td>
                  <td>
                    <span className={cx("badge badge-pass")}>Passed</span>
                  </td>
                </tr>
                <tr>
                  <td>Lead (Pb)</td>
                  <td>&lt; 0.001 mg/L</td>
                  <td>&lt; 0.01 mg/L</td>
                  <td>
                    <span className={cx("badge badge-pass")}>Passed</span>
                  </td>
                </tr>
                <tr>
                  <td>Arsenic (As)</td>
                  <td>&lt; 0.001 mg/L</td>
                  <td>&lt; 0.01 mg/L</td>
                  <td>
                    <span className={cx("badge badge-pass")}>Passed</span>
                  </td>
                </tr>
                <tr>
                  <td>Turbidity</td>
                  <td>0.5 NTU</td>
                  <td>&lt; 5 NTU</td>
                  <td>
                    <span className={cx("badge badge-pass")}>Passed</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className={cx("lab-actions")}>
        <button type="button" className={cx("btn btn-primary")} onClick={downloadReport}>
              <i className={cx("fas fa-download")}></i>
              {' '}Download Full Report
            </button>
          </div>
            </div>
      </section>
      {/* Quality Assurance */}
      <section className={cx("quality-assurance")}>
        <div className={cx("container")}>
          <h2 className={cx("section-title")}>Quality You Can Trust</h2>
          <div className={cx("assurance-grid")}>
            <div className={cx("assurance-card")}>
              <i className={cx("fas fa-flask")}></i>
              <h3>Monthly Testing</h3>
              <p>We test our water quality every month at a DOH-accredited laboratory</p>
            </div>
            <div className={cx("assurance-card")}>
              <i className={cx("fas fa-certificate")}></i>
              <h3>DOH Compliant</h3>
              <p>Our stations comply with Philippine National Standards for Drinking Water (PNSDW)</p>
            </div>
            <div className={cx("assurance-card")}>
              <i className={cx("fas fa-clock")}></i>
              <h3>Daily Monitoring</h3>
              <p>Our staff performs daily in-house water quality checks before delivery</p>
            </div>
          </div>
            </div>
      </section>
      <footer className={cx('footer')}>
        <div className={cx('container')}>
          <div className={cx('footer-bottom')}>
            <p>© 2024 AquaPro. All rights reserved.</p>
              </div>
            </div>
      </footer>
    </>
  );
}
