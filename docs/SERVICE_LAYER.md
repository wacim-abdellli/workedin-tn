# Khedma TN — Service Layer API Reference

## Overview
All Supabase queries are centralized in `src/services/`. Import via barrel:
```ts
import { jobsService, profilesService } from '@/services';
```

## Jobs (`src/services/jobs.ts`)
| Function | Params | Returns |
|----------|--------|---------|
| `getJobs(filters?, page?, pageSize?)` | `JobFilters`, page (default 1), size (default 20) | Jobs with client info + count |
| `getJobById(jobId)` | UUID | Single job with client |
| `getJobsByClient(clientId)` | UUID | All jobs by client |
| `getSimilarJobs(jobId, category, limit?)` | UUID, string, number | Related jobs |
| `createJob(data)` | `CreateJobInput` | `{ id }` |
| `updateJob(jobId, data)` | UUID, partial | — |
| `incrementJobViews(jobId, currentViews)` | UUID, number | — |

## Proposals (`src/services/proposals.ts`)
| Function | Params | Returns |
|----------|--------|---------|
| `getProposalsByJob(jobId)` | UUID | Proposals with freelancer info |
| `getMyProposal(jobId, freelancerId)` | UUID, UUID | Single or null |
| `createProposal(data, files?)` | `CreateProposalInput`, File[] | — |
| `withdrawProposal(proposalId)` | UUID | — |

## Contracts (`src/services/contracts.ts`)
| Function | Params | Returns |
|----------|--------|---------|
| `getContractById(contractId)` | UUID | Full contract with joins |
| `getContractsByUser(userId)` | UUID | All user contracts |
| `createContract(data)` | `{job_id, client_id, freelancer_id, amount}` | Contract |
| `getMilestones(contractId)` | UUID | Ordered milestones |
| `createMilestone(data)` | Milestone fields | Milestone |

## Profiles (`src/services/profiles.ts`)
| Function | Params | Returns |
|----------|--------|---------|
| `getProfileById(userId)` | UUID | Profile |
| `getFreelancerProfile(userId)` | UUID | Freelancer profile |
| `getFreelancers(filters?, page?, pageSize?)` | Filters, page, size | Freelancers + count |
| `updateProfile(userId, data)` | UUID, Record | — |
| `uploadAvatar(userId, file)` | UUID, File | URL string |
| `toggleFavorite(userId, jobId, isSaved)` | UUID, UUID, boolean | — |
| `getClientStats(clientId)` | UUID | `{totalJobs, totalSpent, rating}` |

## Messages (`src/services/messages.ts`)
| Function | Params | Returns |
|----------|--------|---------|
| `getMessages(contractId)` | UUID | Messages with sender |
| `sendMessage(data)` | Message fields | — |
| `subscribeToMessages(contractId, callback)` | UUID, fn | Realtime channel |

## Notifications (`src/services/notifications.ts`)
| Function | Params | Returns |
|----------|--------|---------|
| `getNotifications(userId)` | UUID | Up to 50 notifications |
| `getUnreadCount(userId)` | UUID | Count |
| `createNotification(data)` | `{user_id, type, content, link?}` | — |
| `markAllRead(userId)` | UUID | — |
| `subscribeToNotifications(userId, callback)` | UUID, fn | Realtime channel |

## Payments (`src/services/payments.ts`)
| Function | Params | Returns |
|----------|--------|---------|
| `getWallet(userId)` | UUID | Wallet |
| `getTransactions(userId, page?, pageSize?)` | UUID, page, size | Transactions + count |
| `requestWithdrawal(data)` | Withdrawal fields | — |
| `completeEscrowPayment(...)` | 4 params | RPC result |
| `getEarningsStats(userId)` | UUID | `{wallet, totalEarnings, transactionCount}` |
