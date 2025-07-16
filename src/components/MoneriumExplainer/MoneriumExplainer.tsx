import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './MoneriumExplainer.module.css';

interface MoneriumExplainerProps {
  isVisible: boolean;
}

const MoneriumExplainer: React.FC<MoneriumExplainerProps> = ({ isVisible }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (!isVisible) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <h3 className={styles.title}>{t('monerium.title')}</h3>
        <button
          className={styles.toggleButton}
          aria-label={isOpen ? t('monerium.hide') : t('monerium.show')}
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>
      {isOpen && (
        <div className={styles.content}>
          <p className={styles.text}>{t('monerium.description')}</p>
          <a
            href="https://monerium.app"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            {t('monerium.visitMonerium')}
          </a>
        </div>
      )}
    </div>
  );
};

export default MoneriumExplainer;
