import { Link } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import styles from "./NotFound.module.css";

export function NotFound() {
  return (
    <div className={styles.page}>
      <span className={styles.code}>404</span>
      <h1>This seal doesn't fit here.</h1>
      <p>The page you're looking for doesn't exist or has moved.</p>
      <div className={styles.actions}>
        <Link to="/"><Button variant="ghost">Go home</Button></Link>
        <Link to="/shop"><Button variant="primary">Browse products</Button></Link>
      </div>
    </div>
  );
}
