import { motion } from 'motion/react';

export default function PageContainer({ children, className = '' }) {
  return (
    <motion.div
      className={`page-container ${className}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
