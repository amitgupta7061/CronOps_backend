import { asyncHandler } from '../utils/asyncHandler.js';
import prisma from '../prisma/client.js';

/**
 * PUT /api/users/plan
 * Update user plan (Mock payment)
 */
export const updatePlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  if (!['FREE', 'PREMIUM', 'PRO'].includes(plan)) {
    res.status(400);
    throw new Error('Invalid plan');
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { plan },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      isVerified: true,
    },
  });

  res.status(200).json({
    success: true,
    message: `Plan updated to ${plan}`,
    data: user,
  });
});

export default {
  updatePlan,
};
