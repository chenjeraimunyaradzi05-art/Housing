/**
 * Smart Expense Categorization with NLP
 * Automatically categorizes transactions based on merchant names and descriptions
 */

export interface CategorizedTransaction {
  originalDescription: string;
  category: string;
  subcategory: string;
  confidence: number;
  suggestedBudget?: string;
}

// Category patterns with keywords
const CATEGORY_PATTERNS: Record<string, { keywords: string[]; subcategories: Record<string, string[]> }> = {
  'Housing': {
    keywords: ['rent', 'mortgage', 'hoa', 'property', 'apartment', 'lease', 'landlord'],
    subcategories: {
      'Rent': ['rent', 'apartment', 'lease'],
      'Mortgage': ['mortgage', 'home loan'],
      'HOA': ['hoa', 'homeowners'],
      'Property Tax': ['property tax'],
    },
  },
  'Utilities': {
    keywords: ['electric', 'gas', 'water', 'internet', 'phone', 'cable', 'utility', 'power', 'energy'],
    subcategories: {
      'Electricity': ['electric', 'power', 'energy'],
      'Gas': ['gas', 'natural gas'],
      'Water': ['water', 'sewer'],
      'Internet': ['internet', 'broadband', 'fiber'],
      'Phone': ['phone', 'mobile', 'wireless', 'verizon', 'att', 't-mobile'],
    },
  },
  'Groceries': {
    keywords: ['grocery', 'supermarket', 'food', 'market', 'whole foods', 'trader joe', 'safeway', 'kroger', 'walmart', 'target', 'costco'],
    subcategories: {
      'Supermarket': ['walmart', 'target', 'costco', 'safeway', 'kroger'],
      'Specialty': ['whole foods', 'trader joe', 'sprouts'],
      'Convenience': ['7-eleven', 'cvs', 'walgreens'],
    },
  },
  'Dining': {
    keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'chipotle', 'uber eats', 'doordash', 'grubhub', 'pizza'],
    subcategories: {
      'Fast Food': ['mcdonald', 'burger', 'wendy', 'taco bell', 'chipotle'],
      'Coffee': ['starbucks', 'coffee', 'cafe', 'dunkin'],
      'Delivery': ['uber eats', 'doordash', 'grubhub', 'postmates'],
      'Restaurant': ['restaurant', 'dining', 'bistro', 'grill'],
    },
  },
  'Transportation': {
    keywords: ['gas', 'fuel', 'uber', 'lyft', 'parking', 'toll', 'transit', 'metro', 'bus', 'car'],
    subcategories: {
      'Fuel': ['gas', 'fuel', 'shell', 'chevron', 'exxon', 'bp'],
      'Rideshare': ['uber', 'lyft'],
      'Public Transit': ['metro', 'transit', 'bus', 'train', 'subway'],
      'Parking': ['parking', 'garage'],
    },
  },
  'Shopping': {
    keywords: ['amazon', 'ebay', 'shop', 'store', 'mall', 'clothing', 'shoes', 'fashion'],
    subcategories: {
      'Online': ['amazon', 'ebay', 'etsy', 'shopify'],
      'Clothing': ['clothing', 'apparel', 'fashion', 'shoes', 'nordstrom', 'zara', 'h&m'],
      'Electronics': ['best buy', 'apple', 'electronic'],
      'Home': ['home depot', 'lowes', 'ikea', 'furniture'],
    },
  },
  'Entertainment': {
    keywords: ['netflix', 'spotify', 'hulu', 'disney', 'movie', 'theater', 'concert', 'game', 'steam', 'playstation', 'xbox'],
    subcategories: {
      'Streaming': ['netflix', 'spotify', 'hulu', 'disney', 'hbo', 'prime video', 'apple tv'],
      'Gaming': ['steam', 'playstation', 'xbox', 'nintendo', 'game'],
      'Events': ['movie', 'theater', 'concert', 'ticketmaster', 'event'],
    },
  },
  'Healthcare': {
    keywords: ['doctor', 'hospital', 'pharmacy', 'medical', 'health', 'dental', 'vision', 'insurance'],
    subcategories: {
      'Doctor': ['doctor', 'physician', 'clinic', 'medical'],
      'Pharmacy': ['pharmacy', 'cvs', 'walgreens', 'rite aid'],
      'Dental': ['dental', 'dentist', 'orthodont'],
      'Insurance': ['health insurance', 'medical insurance'],
    },
  },
  'Personal Care': {
    keywords: ['salon', 'spa', 'haircut', 'beauty', 'gym', 'fitness'],
    subcategories: {
      'Grooming': ['salon', 'haircut', 'barber', 'beauty'],
      'Fitness': ['gym', 'fitness', 'yoga', 'peloton'],
      'Spa': ['spa', 'massage', 'wellness'],
    },
  },
  'Education': {
    keywords: ['school', 'tuition', 'course', 'book', 'learning', 'udemy', 'coursera'],
    subcategories: {
      'Tuition': ['school', 'tuition', 'university', 'college'],
      'Online Learning': ['udemy', 'coursera', 'skillshare', 'masterclass'],
      'Books': ['book', 'amazon kindle', 'audible'],
    },
  },
  'Insurance': {
    keywords: ['insurance', 'geico', 'progressive', 'state farm', 'allstate', 'policy'],
    subcategories: {
      'Auto': ['auto insurance', 'car insurance', 'geico', 'progressive'],
      'Home': ['home insurance', 'homeowners', 'renters'],
      'Life': ['life insurance'],
    },
  },
  'Investments': {
    keywords: ['investment', 'stock', 'dividend', 'brokerage', 'fidelity', 'vanguard', 'schwab', 'robinhood'],
    subcategories: {
      'Brokerage': ['fidelity', 'vanguard', 'schwab', 'robinhood', 'etrade'],
      'Crypto': ['coinbase', 'crypto', 'bitcoin'],
    },
  },
  'Income': {
    keywords: ['payroll', 'salary', 'direct deposit', 'paycheck', 'wage'],
    subcategories: {
      'Salary': ['payroll', 'salary', 'direct deposit', 'paycheck'],
      'Freelance': ['freelance', 'contractor', 'consulting'],
    },
  },
};

/**
 * Categorize a single transaction
 */
export function categorizeTransaction(description: string): CategorizedTransaction {
  const normalizedDesc = description.toLowerCase();

  let bestMatch = {
    category: 'Uncategorized',
    subcategory: 'Other',
    confidence: 0,
  };

  for (const [category, data] of Object.entries(CATEGORY_PATTERNS)) {
    // Check main category keywords
    for (const keyword of data.keywords) {
      if (normalizedDesc.includes(keyword)) {
        const keywordLength = keyword.length;
        const confidence = Math.min(0.95, 0.6 + (keywordLength / 20));

        if (confidence > bestMatch.confidence) {
          // Find subcategory
          let subcategory = 'Other';
          for (const [subcat, subKeywords] of Object.entries(data.subcategories)) {
            if (subKeywords.some((sk) => normalizedDesc.includes(sk))) {
              subcategory = subcat;
              break;
            }
          }

          bestMatch = { category, subcategory, confidence };
        }
      }
    }
  }

  return {
    originalDescription: description,
    category: bestMatch.category,
    subcategory: bestMatch.subcategory,
    confidence: bestMatch.confidence,
    suggestedBudget: bestMatch.category !== 'Uncategorized' ? bestMatch.category : undefined,
  };
}

/**
 * Batch categorize multiple transactions
 */
export function categorizeTransactions(
  descriptions: string[]
): CategorizedTransaction[] {
  return descriptions.map(categorizeTransaction);
}

/**
 * Learn from user corrections (placeholder for ML training)
 */
export async function learnFromCorrection(
  originalDescription: string,
  suggestedCategory: string,
  correctCategory: string,
  correctSubcategory?: string
): Promise<void> {
  // In a real implementation, this would:
  // 1. Store the correction in a training dataset
  // 2. Periodically retrain the model
  // 3. Update the keyword patterns
  console.log(`Learning: "${originalDescription}" should be ${correctCategory}/${correctSubcategory}, not ${suggestedCategory}`);
}

/**
 * Get category suggestions based on partial input
 */
export function suggestCategories(partialDescription: string): string[] {
  const normalizedInput = partialDescription.toLowerCase();
  const suggestions: Set<string> = new Set();

  for (const [category, data] of Object.entries(CATEGORY_PATTERNS)) {
    for (const keyword of data.keywords) {
      if (keyword.includes(normalizedInput) || normalizedInput.includes(keyword)) {
        suggestions.add(category);
        break;
      }
    }
  }

  return Array.from(suggestions).slice(0, 5);
}

/**
 * Get all available categories
 */
export function getAllCategories(): { category: string; subcategories: string[] }[] {
  return Object.entries(CATEGORY_PATTERNS).map(([category, data]) => ({
    category,
    subcategories: Object.keys(data.subcategories),
  }));
}
