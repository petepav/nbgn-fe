import React from 'react';
import { useTranslation } from 'react-i18next';
import { VoucherCreate } from './VoucherCreate';
import { VoucherDashboard } from './VoucherDashboard';
import './VoucherWidget.css';

export const VoucherWidget: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="voucher-widget">
      <div className="widget-header">
        <h2>
          <i className="fas fa-gift"></i>
          {t('voucher:title', 'NBGN Vouchers')}
        </h2>
        <p className="widget-description">
          {t('voucher:description', 'Send NBGN to anyone, even without a wallet!')}
        </p>
      </div>
      
      <VoucherCreate />
      <VoucherDashboard />
    </div>
  );
};