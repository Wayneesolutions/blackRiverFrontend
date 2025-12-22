import type { AxiosResponse } from "axios";
import apiClient from "../apiClient";

interface Error {
  response?: {
    data?: {
      message: string;
    };
  };
}

export interface ChatMessage {
  _id: string;
  tripId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
  };
  senderType: "driver" | "dispatcher" | "admin";
  senderName: string;
  message: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: "image" | "pdf" | "document" | "other";
  fileSize?: number;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessagesResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  };
  message: string;
}

// Get chat messages for a trip
export const getTripChatMessages = async (
  tripId: string,
  page: number = 1,
  limit: number = 50
): Promise<ChatMessagesResponse> => {
  try {
    const res: AxiosResponse = await apiClient.get(
      `chat/trip/${tripId}/messages`,
      {
        params: { page, limit },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Get chat messages error:", error);
    return (error as Error).response?.data || {
      success: false,
      message: "Failed to fetch chat messages",
      data: { messages: [], pagination: { current: 1, pages: 0, total: 0, limit: 50 } },
    };
  }
};

// Send a chat message (with optional file)
export const sendChatMessage = async (
  tripId: string,
  message: string,
  file?: File
): Promise<{ success: boolean; data?: ChatMessage; message: string }> => {
  try {
    const formData = new FormData();
    formData.append("message", message);
    if (file) {
      formData.append("file", file);
    }

    const res: AxiosResponse = await apiClient.post(
      `chat/trip/${tripId}/message`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Send chat message error:", error);
    return (error as Error).response?.data || {
      success: false,
      message: "Failed to send message",
    };
  }
};

// Mark messages as read
export const markMessagesAsRead = async (
  tripId: string
): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    const res: AxiosResponse = await apiClient.post(
      `chat/trip/${tripId}/mark-read`
    );
    return res.data;
  } catch (error) {
    console.error("Mark messages as read error:", error);
    return (error as Error).response?.data || {
      success: false,
      message: "Failed to mark messages as read",
    };
  }
};

// Get unread message count
export const getUnreadMessageCount = async (
  tripId: string
): Promise<{ success: boolean; data: { unreadCount: number } }> => {
  try {
    const res: AxiosResponse = await apiClient.get(
      `chat/trip/${tripId}/unread-count`
    );
    return res.data;
  } catch (error) {
    console.error("Get unread count error:", error);
    return (error as Error).response?.data || {
      success: false,
      data: { unreadCount: 0 },
    };
  }
};

// Get signed URL for chat message file
export const getChatMessageFileSignedUrl = async (
  messageId: string,
  disposition: 'inline' | 'attachment' = 'inline'
): Promise<{ success: boolean; url: string; expiresIn: number }> => {
  try {
    const res: AxiosResponse = await apiClient.get(
      `chat/message/${messageId}/file-signed-url`,
      { params: { disposition } }
    );
    return res.data;
  } catch (error) {
    console.error("Get chat message file signed URL error:", error);
    return (error as Error).response?.data || {
      success: false,
      url: '',
      expiresIn: 0,
    };
  }
};

