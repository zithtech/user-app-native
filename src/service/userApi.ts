import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQueryWithReauth';
import { Trip } from '../types/trip';

interface TripsApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: Trip[]; // This is the Array(13) you see in logs
  meta: {
    requestId: string;
    timestamp: string;
    service: string;
    version: string;
  };
  error: any;
}
interface PaginatedTripsApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    data: Trip[];
    total: number;
  };
  meta: {
    requestId: string;
    timestamp: string;
    service: string;
    version: string;
  };
  error: any;
}
interface TripApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: any; // This is the Array(13) you see in logs
  meta: {
    requestId: string;
    timestamp: string;
    service: string;
    version: string;
  };
  error: any;
}
interface UserResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {}; // This is the Array(13) you see in logs
  meta: {
    requestId: string;
    timestamp: string;
    service: string;
    version: string;
  };
  error: any;
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Trip'],
  endpoints: builder => ({
    sendOtp: builder.mutation({
      query: data => ({
        url: '/auth/request-otp',
        method: 'POST',
        body: data,
      }),
    }),
    verifyOtp: builder.mutation({
      query: data => ({
        url: '/auth/verify-otp',
        method: 'POST',
        body: data,
      }),
    }),

    //auth
    refreshAccessToken: builder.mutation({
      query: data => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body: data,
      })
    }),

    //user
    signUp: builder.mutation({
      query: data => ({
        url: '/auth/signup',
        method: 'POST',
        body: data,
      }),
    }),
    addUser: builder.mutation({
      query: data => ({
        url: '/users/',
        method: 'POST',
        body: data,
      }),
    }),
    uploadDocument: builder.mutation({
      query: data => ({
        url: '/users/add-user',
        method: 'POST',
        body: data,
      }),
    }),
    getUser: builder.query<UserResponse, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      })
    }),
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/users/update/${id}`,
        method: 'PATCH',
        body: data,
      })
    }),

    signOutUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/auth/signout/${id}`,
        method: "POST",
        body: data,
      }),
    }),

    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/${id}`,
        method: "DELETE",
      }),
    }),


    // getUploadUrl: builder.mutation({
    //   query: data => ({
    //     url: '/generate-presigned-url/presigned-url',
    //     method: 'POST',
    //     body: data,
    //   })
    // }),
    getUploadUrl: builder.mutation({
      query: data => ({
        url: `/users/documents/${data.userId}/upload-url`,
        method: 'POST',
        body: data,
      })
    }),

    deleteDocument: builder.mutation({
      query: data => ({
        url: `/users/documents/${data.userId}/delete`,
        method: 'DELETE',
        body: data,
      })
    }),

    updateFcmToken: builder.mutation<{ success: boolean }, { fcmToken: string, id: string }>({
      query: (body) => ({
        url: '/users/update-fcm-token',
        method: 'POST',
        body: body,
      }),
    }),


    uploadImageToS3: builder.mutation<void, { url: string; file: Blob; type: string }>({
      query: ({ url, file, type }) => ({
        url: url, // Full S3 URL overrides BASE_URL
        method: 'PUT',
        body: file,
        headers: {
          "Content-Type": type,
          "x-ms-blob-type": "BlockBlob",
        },
      }),

    }),


    // Trip
    createTrip: builder.mutation({
      query: data => ({
        url: '/trips/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Trip']
    }),
    getAllTrips: builder.query<TripsApiResponse, void>({
      query: () => ({
        url: '/trips/all',
        method: 'GET',
      }),
      providesTags: ['Trip']
    }),
    getTrip: builder.query<PaginatedTripsApiResponse, { id: string, limit?: number, tab?: string }>({
      query: ({ id, limit, tab }) => ({
        url: `/trips/${id}`,
        method: "POST",
        body: {
          role: "customer",
          limit: limit,
          tab: tab
        }
      }),
      providesTags: ['Trip']
    }),
    getByTripId: builder.query<TripApiResponse, string>({
      query: (id) => ({
        url: `/trips/bytripid/${id}`,
        method: "GET",
      }),
      providesTags: ['Trip']
    }),
    getActiveTripbyUserId: builder.query<TripApiResponse, string>({
      query: (id) => ({
        url: `/trips/activetrip/${id}`,
        method: "GET",
      }),
      providesTags: ['Trip']
    }),
    updateTrip: builder.mutation({
      query: ({ trip_id, ...data }) => ({
        url: `/trips/update/${trip_id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Trip']
    }),
    updateTripChanges: builder.mutation({
      query: data => ({
        url: '/trips/change/create',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Trip']
    }),




    //Driver
    getDriver: builder.query({
      query: (id) => ({
        url: `/drivers/${id}`,
        method: 'GET',
      })
    }),

    findNearbyDrivers: builder.mutation({
      query: data => ({
        url: '/drivers/search',
        method: 'POST',
        body: data,
      })
    }),


    //Payment
    createPaymentOrder: builder.mutation({
      query: data => ({
        url: '/payment/create-ride-order',
        method: 'POST',
        body: data,
      })
    }),

    verifyPayment: builder.mutation({
      query: data => ({
        url: '/payment/verify-ride-payment',
        method: 'POST',
        body: data,
      })
    }),

    //pricing
    // getPricing: builder.mutation({
    //   query: data => ({
    //     url: '/pricing/calculate-all-types',
    //     method: 'POST',
    //     body: data,
    //   })
    // }),

    getPricing: builder.mutation({
      query: data => ({
        url: '/pricing/quote',
        method: 'POST',
        body: data,
      })
    }),

    // ─────────── USER WALLET ───────────
    getWalletBalance: builder.query<any, string>({
      query: (userId) => `/users/wallet/${userId}/balance`,
    }),
    getWalletTransactions: builder.query<any, { userId: string; limit?: number }>({
      query: ({ userId, limit = 20 }) => `/users/wallet/${userId}/transactions?limit=${limit}`,
    }),
    setupWalletPin: builder.mutation<any, { id: string; pin: string }>({
      query: (body) => ({
        url: `/users/wallet/${body.id}/setup-pin`,
        method: 'POST',
        body: { pin: body.pin },
      }),
    }),
    createWalletTopupOrder: builder.mutation<any, { userId: string; amount: number }>({
      query: ({ userId, amount }) => ({
        url: `/users/wallet/${userId}/topup/order`,
        method: 'POST',
        body: { amount },
      }),
    }),
    verifyWalletTopupPayment: builder.mutation<any, { userId: string; amount: number; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }>({
      query: ({ userId, ...body }) => ({
        url: `/users/wallet/${userId}/topup/verify`,
        method: 'POST',
        body,
      }),
    }),
    payTripWithWallet: builder.mutation<any, { userId: string; amount: number; pin: string; trip_id?: string; description?: string }>({
      query: ({ userId, ...body }) => ({
        url: `/users/wallet/${userId}/pay-trip`,
        method: 'POST',
        body,
      }),
    }),
    getWalletSettings: builder.query<any, string>({
      query: (userId) => `/wallet/settings/${userId}`,
    }),
    updateWalletSettings: builder.mutation<any, { userId: string; enabled?: boolean; threshold_amount?: number; reload_amount?: number; payment_method?: string }>({
      query: ({ userId, ...body }) => ({
        url: `/wallet/settings/${userId}`,
        method: 'PUT',
        body,
      }),
    }),
    reportTransactionIssue: builder.mutation<any, { userId: string; transactionId: string; rideId?: string; category: string; description: string }>({
      query: (body) => ({
        url: `/support/tickets/user`,
        method: 'POST',
        body: {
          user_id: body.userId,
          subject: `Transaction Issue: ${body.transactionId}`,
          description: `Ride ID: ${body.rideId || 'N/A'}\nCategory: ${body.category}\n\n${body.description}`,
          category: 'payment'
        },
      }),
    }),


    // ─────────── ACCOUNT DELETION ───────────
    initiateDeleteAccount: builder.mutation<any, string>({
      query: (id) => ({
        url: `/users/${id}/delete/initiate`,
        method: 'POST',
      }),
    }),
    verifyOTPForDelete: builder.mutation<any, { id: string; otp: string; reason?: string; phone_number?: string; role?: string; device_id?: string }>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}/delete/verify-otp`,
        method: 'POST',
        body,
      }),
    }),
    cancelDeleteAccount: builder.mutation<any, string>({
      query: (id) => ({
        url: `/users/${id}/delete/cancel`,
        method: 'POST',
      }),
    }),
    getDeleteAccountStatus: builder.query<any, string>({
      query: (id) => `/users/${id}/delete/status`,
    }),



  }),
});


export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useSignUpMutation,
  useAddUserMutation,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,

  useGetUserQuery,
  useUpdateUserMutation,
  useRefreshAccessTokenMutation,
  useCreateTripMutation,
  useGetAllTripsQuery,
  useGetTripQuery,
  useGetByTripIdQuery,
  useLazyGetByTripIdQuery,
  useGetActiveTripbyUserIdQuery,
  useLazyGetActiveTripbyUserIdQuery,
  useUpdateTripMutation,
  useUpdateTripChangesMutation,

  useSignOutUserMutation,
  useDeleteUserMutation,

  useGetUploadUrlMutation,
  useFindNearbyDriversMutation,
  useUploadImageToS3Mutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetDriverQuery,

  useUpdateFcmTokenMutation,
  useGetPricingMutation,

  // Wallet
  useGetWalletBalanceQuery,
  useLazyGetWalletBalanceQuery,
  useGetWalletTransactionsQuery,
  useLazyGetWalletTransactionsQuery,
  useSetupWalletPinMutation,
  useCreateWalletTopupOrderMutation,
  useVerifyWalletTopupPaymentMutation,
  usePayTripWithWalletMutation,
  useGetWalletSettingsQuery,
  useUpdateWalletSettingsMutation,
  useReportTransactionIssueMutation,

  useInitiateDeleteAccountMutation,
  useVerifyOTPForDeleteMutation,
  useCancelDeleteAccountMutation,
  useGetDeleteAccountStatusQuery,
  useLazyGetDeleteAccountStatusQuery,

} = userApi;


