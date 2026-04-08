import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuctionPanel from './AuctionPanel';

describe('AuctionPanel', () => {
    it('renders correctly', () => {
        render(<AuctionPanel />);
        expect(screen.getByText(/Auction Panel/i)).toBeInTheDocument();
    });
    
    it('displays the correct auction details', () => {
        const auctionDetails = { title: 'Art Auction', price: '$1000' };
        render(<AuctionPanel details={auctionDetails} />);
        expect(screen.getByText(/Art Auction/i)).toBeInTheDocument();
        expect(screen.getByText(/\$1000/i)).toBeInTheDocument();
    });
});