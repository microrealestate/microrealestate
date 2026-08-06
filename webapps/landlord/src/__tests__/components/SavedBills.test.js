/**
 * Tests for SavedBills component — split table, QB badge, recapture UI
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Minimal mock for the icons used in SavedBills
jest.mock('react-icons/lu', () => ({
  LuArrowDown: () => null,
  LuArrowUp: () => null,
  LuBookmark: () => null,
  LuCheck: () => null,
  LuDownload: () => null,
  LuEye: () => null,
  LuExternalLink: () => null,
  LuFileSearch: () => null,
  LuFileText: () => null,
  LuLock: () => null,
  LuMail: () => null,
  LuRefreshCw: () => null,
  LuSearch: () => null,
  LuSend: () => null,
  LuTrash2: () => null,
  LuUpload: () => null,
  LuX: () => null
}));

// Stub UI primitives
jest.mock('../../components/ui/button', () => ({
  Button: ({ children, onClick, disabled, title, className }) => (
    <button onClick={onClick} disabled={disabled} title={title} className={className}>
      {children}
    </button>
  )
}));
jest.mock('../../components/ui/card', () => ({
  Card: ({ children, className }) => <div className={className}>{children}</div>
}));
jest.mock('../../components/ui/input', () => ({
  Input: (props) => <input {...props} />
}));
jest.mock('../../components/ui/dialog', () => ({
  Dialog: ({ children, open }) => (open ? <div role="dialog">{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
  DialogDescription: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>
}));

const SavedBills = require('../../components/utilities/SavedBills').default;

// ── Helpers ──────────────────────────────────────────────────────────────────

const t = (key) => key;
const toCurrency = (v) => `$${Number(v || 0).toFixed(2)}`;
const router = { push: jest.fn(), query: { organization: 'org1' } };

function makePropertyById(extras = {}) {
  return {
    'prop-001': { _id: 'prop-001', name: '720 McLoughlin Blvd' },
    'prop-002': { _id: 'prop-002', name: 'Unit A' },
    'prop-003': { _id: 'prop-003', name: 'Unit B' },
    ...extras
  };
}

function makeUtility(overrides = {}) {
  return {
    _id: 'util-001',
    propertyId: 'prop-001',
    type: 'water',
    billingMonth: '2026-08',
    provider: 'Oregon City Utility',
    accountNumber: '07-709600-03',
    amount: 75.46,
    originalAmount: 75.46,
    paidDate: '2026-08-03',
    attachmentIds: ['att-001'],
    attachments: [],
    source: 'manual',
    splitItems: [],
    lastUpdatedBy: 'matthew@butlerbaker.com',
    ...overrides
  };
}

function defaultProps(overrides = {}) {
  return {
    t,
    filteredUtilities: [makeUtility()],
    totalAmount: 75.46,
    loading: false,
    searchText: '',
    setSearchText: jest.fn(),
    typeFilter: 'all',
    setTypeFilter: jest.fn(),
    monthFilter: 'all',
    setMonthFilter: jest.fn(),
    propertyFilter: 'all',
    setPropertyFilter: jest.fn(),
    propertyOptions: [],
    availableCategories: ['water'],
    billingMonths: ['2026-08'],
    propertyById: makePropertyById(),
    normalizeCategory: (v) => v,
    formatCategoryLabel: (v) => v.charAt(0).toUpperCase() + v.slice(1),
    toCurrency,
    router,
    isError: false,
    workingUtilityAttachmentId: '',
    handlePreviewUtilityBillAttachment: jest.fn(),
    handleDownloadUtilityBillAttachment: jest.fn(),
    onGenerateInvoices: jest.fn(),
    onLogQbPosted: jest.fn(),
    onRecaptureEmailBill: jest.fn(),
    onReuploadBill: jest.fn(),
    onPreviewAttachment: jest.fn(),
    onDownloadAttachment: jest.fn(),
    recapturingUtilityId: '',
    reuploadUtilityId: '',
    ...overrides
  };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('SplitBreakdownTable', () => {
  it('renders a property row even for bills with no split (always visible)', () => {
    const { getAllByText } = render(<SavedBills {...defaultProps()} />);
    // Property name appears in both the bill info table and the split table
    expect(getAllByText('720 McLoughlin Blvd').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Meter / Unit').length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT show "Full bill (before split)" footer when originalAmount equals amount', () => {
    const { queryByText } = render(<SavedBills {...defaultProps()} />);
    expect(queryByText('Full bill (before split)')).toBeNull();
  });

  it('renders split table when originalAmount differs from amount', () => {
    const utility = makeUtility({ amount: 50.31, originalAmount: 120.00 });
    const { getByText, getAllByText } = render(
      <SavedBills {...defaultProps({ filteredUtilities: [utility] })} />
    );
    expect(getByText('Full bill (before split)')).toBeInTheDocument();
    // $50.31 appears in both the card header and the split table row
    expect(getAllByText('$50.31').length).toBeGreaterThanOrEqual(1);
    expect(getByText('$120.00')).toBeInTheDocument();
  });

  it('renders sub-unit rows for percentage splitItems', () => {
    const utility = makeUtility({
      amount: 100,
      originalAmount: 200,
      splitItems: [
        { subPropertyId: 'prop-002', splitType: 'percentage', percentage: 60 },
        { subPropertyId: 'prop-003', splitType: 'percentage', percentage: 40 }
      ]
    });
    const propertyById = makePropertyById();
    const { getByText } = render(
      <SavedBills {...defaultProps({ filteredUtilities: [utility], propertyById })} />
    );
    expect(getByText('Unit A')).toBeInTheDocument();
    expect(getByText('Unit B')).toBeInTheDocument();
    expect(getByText('60%')).toBeInTheDocument();
    expect(getByText('40%')).toBeInTheDocument();
  });

  it('renders equal split label for equal splitItems', () => {
    const utility = makeUtility({
      amount: 80,
      splitItems: [
        { subPropertyId: 'prop-002', splitType: 'equal' },
        { subPropertyId: 'prop-003', splitType: 'equal' }
      ]
    });
    const { getAllByText } = render(
      <SavedBills {...defaultProps({ filteredUtilities: [utility] })} />
    );
    // Two 'equal' labels for two items
    expect(getAllByText('equal').length).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('QuickBooks badge', () => {
  it('shows "Not Entered QuickBooks" when qbPostedAt is null', () => {
    const { getByText } = render(<SavedBills {...defaultProps()} />);
    expect(getByText('Not Entered QuickBooks')).toBeInTheDocument();
  });

  it('shows QB badge with date and poster when qbPostedAt is set', () => {
    const utility = makeUtility({ qbPostedAt: '2026-08-01T10:00:00Z', qbPostedBy: 'alice@test.com' });
    const { getByText } = render(
      <SavedBills {...defaultProps({ filteredUtilities: [utility] })} />
    );
    expect(getByText('QuickBooks')).toBeInTheDocument();
    expect(getByText('2026-08-01')).toBeInTheDocument();
    expect(getByText('alice@test.com')).toBeInTheDocument();
  });

  it('opens QB input dialog on clicking "Not Entered QuickBooks"', () => {
    const { getByText, queryByPlaceholderText } = render(<SavedBills {...defaultProps()} />);
    expect(queryByPlaceholderText('QB ref # (optional)')).toBeNull();
    fireEvent.click(getByText('Not Entered QuickBooks'));
    expect(queryByPlaceholderText('QB ref # (optional)')).toBeInTheDocument();
  });

  it('calls onLogQbPosted with utilityId and ref on Log click', () => {
    const onLogQbPosted = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <SavedBills {...defaultProps({ onLogQbPosted })} />
    );
    fireEvent.click(getByText('Not Entered QuickBooks'));
    fireEvent.change(getByPlaceholderText('QB ref # (optional)'), { target: { value: 'QB-123' } });
    fireEvent.click(getByText('Log'));
    expect(onLogQbPosted).toHaveBeenCalledWith('util-001', 'QB-123');
  });

  it('opens re-log dialog when clicking the QB badge', () => {
    const utility = makeUtility({ qbPostedAt: '2026-08-01T10:00:00Z' });
    const { getByText, queryByPlaceholderText } = render(
      <SavedBills {...defaultProps({ filteredUtilities: [utility] })} />
    );
    expect(queryByPlaceholderText('QB ref # (optional)')).toBeNull();
    fireEvent.click(getByText('QuickBooks'));
    expect(queryByPlaceholderText('QB ref # (optional)')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AttachmentsList', () => {
  it('shows icon buttons (View/Download titles) per attachment', () => {
    const utility = makeUtility({
      attachments: [
        { _id: 'att-pdf', filename: 'water-aug-2026.pdf', mimeType: 'application/pdf' },
        { _id: 'att-txt', filename: 'utility-email-import.txt', mimeType: 'text/plain' }
      ]
    });
    const { getAllByTitle } = render(<SavedBills {...defaultProps({ filteredUtilities: [utility] })} />);
    expect(getAllByTitle('View').length).toBe(2);
    expect(getAllByTitle('Download').length).toBe(2);
  });

  it('calls onPreviewAttachment with correct attachmentId', () => {
    const onPreviewAttachment = jest.fn();
    const utility = makeUtility({
      attachments: [{ _id: 'att-001', filename: 'bill.pdf', mimeType: 'application/pdf' }]
    });
    const { getByText } = render(
      <SavedBills {...defaultProps({ filteredUtilities: [utility], onPreviewAttachment })} />
    );
    fireEvent.click(getByText('View'));
    expect(onPreviewAttachment).toHaveBeenCalledWith('att-001', 'bill.pdf');
  });

  it('shows "Attach file" button for any bill (always visible when onUploadBill provided)', () => {
    const utility = makeUtility({
      attachments: [{ _id: 'att-txt', filename: 'utility-email.txt', mimeType: 'text/plain' }]
    });
    const { getByText } = render(<SavedBills {...defaultProps({ filteredUtilities: [utility] })} />);
    expect(getByText('Attach file')).toBeInTheDocument();
  });

  it('also shows "Attach file" when a PDF already exists', () => {
    const utility = makeUtility({
      attachments: [{ _id: 'att-pdf', filename: 'bill.pdf', mimeType: 'application/pdf' }]
    });
    const { getByText } = render(<SavedBills {...defaultProps({ filteredUtilities: [utility] })} />);
    expect(getByText('Attach file')).toBeInTheDocument();
  });

  it('shows "No source bill attached" when attachments array is empty', () => {
    const utility = makeUtility({ attachments: [], attachmentIds: [] });
    const { getByText } = render(<SavedBills {...defaultProps({ filteredUtilities: [utility] })} />);
    expect(getByText('No source bill attached')).toBeInTheDocument();
  });

  it('shows Recapture email button only for email-source utilities without PDF', () => {
    const emailNoPdf = makeUtility({
      source: 'email',
      attachments: [{ _id: 'att-txt', filename: 'email.txt', mimeType: 'text/plain' }]
    });
    const manualNoPdf = makeUtility({ _id: 'util-002', source: 'manual', attachments: [] });
    const { getAllByText } = render(
      <SavedBills {...defaultProps({ filteredUtilities: [emailNoPdf, manualNoPdf] })} />
    );
    // Only email-source bill without PDF gets Recapture email
    expect(getAllByText('Recapture email').length).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Recapture / re-upload buttons (legacy suite — now in AttachmentsList)', () => {
  it('calls onRecaptureEmailBill with utilityId', () => {
    const onRecaptureEmailBill = jest.fn();
    const utility = makeUtility({
      source: 'email',
      attachments: [{ _id: 'att-txt', filename: 'email.txt', mimeType: 'text/plain' }]
    });
    const { getByText } = render(
      <SavedBills {...defaultProps({ filteredUtilities: [utility], onRecaptureEmailBill })} />
    );
    fireEvent.click(getByText('Recapture email'));
    expect(onRecaptureEmailBill).toHaveBeenCalledWith('util-001');
  });

  it('disables Recapture email button while recapturing', () => {
    const utility = makeUtility({
      source: 'email',
      attachments: [{ _id: 'att-txt', filename: 'email.txt', mimeType: 'text/plain' }]
    });
    const { getByText } = render(
      <SavedBills {...defaultProps({ filteredUtilities: [utility], recapturingUtilityId: 'util-001' })} />
    );
    expect(getByText('Recapture email').closest('button')).toBeDisabled();
  });
});
