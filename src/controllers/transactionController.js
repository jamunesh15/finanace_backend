const Transaction = require('../models/Transaction');

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Admin, Analyst
const createTransaction = async (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.create({
      amount,
      type,
      category,
      date: date || new Date(),
      notes,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions with filtering & pagination
// @route   GET /api/transactions
// @access  All authenticated users
const getTransactions = async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 10, sort = '-date' } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = new RegExp(category, 'i');
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  All authenticated users
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate('createdBy', 'name email');
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });
    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Admin
const updateTransaction = async (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { amount, type, category, date, notes },
      { new: true, runValidators: true }
    );

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Soft delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Admin
const deleteTransaction = async (req, res, next) => {
  try {
    // Bypass the default isDeleted filter for this operation
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found.' });

    res.status(200).json({ success: true, message: 'Transaction deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
