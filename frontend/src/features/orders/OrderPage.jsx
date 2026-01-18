import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  updateQuantityAsync,
  removeFromCartAsync,
  clearCartAsync,
} from "../../store/slices/cartSlice";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt, FaShoppingBag, FaChair } from "react-icons/fa";
import API_BASE from "../../config/api";
import {
  getSocketConfig,
  isServerlessPlatform,
  createSocketConnection,
} from "../../utils/socketConfig";
import { pollOrders } from "../../utils/polling";

import PaymentModal from "./PaymentModal";
import TableSelectionModal from "./Tables/TableSelectionModal";
import MobileStatusNotification from "../../components/notifications/MobileStatusNotification";
import OrderSlip from "./OrderSlip"; // Added for direct slip display

import orderPlacedSound from "../../assets/sounds/foodorderd.mp3";
import orderPreparingSound from "../../assets/sounds/preparing.mp3";
import orderServedSound from "../../assets/sounds/served.mp3";
import orderCompletedSound from "../../assets/sounds/completed.mp3";
import orderDeletedSound from "../../assets/sounds/orderdeleted.mp3";

const STATUS = {
  ORDER: "Order",
  PREPARING: "Preparing",
  SERVED: "Served",
  COMPLETED: "Completed",
};

const EMPTY_ARRAY = [];


// Normalize backend / legacy statuses to new flow
const normalizeStatus = (status) => {
  if (!status) return STATUS.ORDER;
  const s = status.toLowerCase().trim();

  switch (s) {
    case "pending":
    case "order":
      return STATUS.ORDER;

    case "cooking":
    case "ready":
    case "preparing":
      return STATUS.PREPARING;

    case "served":
      return STATUS.SERVED;

    case "complete":
    case "completed":
      return STATUS.COMPLETED;

    default:
      return status;
  }
};

const isCompletedStatus = (status) => normalizeStatus(status) === STATUS.COMPLETED;

const getStatusColorClass = (status) => {
  const n = normalizeStatus(status);
  if (n === STATUS.ORDER) return "text-yellow-600";
  if (n === STATUS.PREPARING) return "text-blue-600";
  if (n === STATUS.SERVED) return "text-green-600";
  if (n === STATUS.COMPLETED) return "text-gray-500";
  return "text-gray-500";
};

const OrderPage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const cart = useAppSelector((state) => state.cart.items);
  const cartTotal = useAppSelector((state) => state.cart.total);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [showOrderSlip, setShowOrderSlip] = useState(false); // For direct order slip
  const [createdOrders, setCreatedOrders] = useState([]); // For direct order slip
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderType, setOrderType] = useState("dine-in"); // 'dine-in' | 'parcel'
  const [selectedTables, setSelectedTables] = useState([]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [contactNumber, setContactNumber] = useState("");
  const [mobileNotification, setMobileNotification] = useState(null);

  const socketRef = useRef(null);
  const audioRef = useRef(null);
  const successAudioRef = useRef(null);
  const preparingAudioRef = useRef(null);
  const servedAudioRef = useRef(null);
  const completedAudioRef = useRef(null);
  const deletedAudioRef = useRef(null);
  const pollingStopRef = useRef(null);

  // 🔊 Play general notification sound
  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/notify.mp3");
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        if (error.name === "NotAllowedError") {
          toast("🔇 Tap here to enable sounds", {
            icon: "🔊",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        }
      });
    } catch (error) {
      // Audio playback error - non-critical
    }
  };

  // 🔊 Play Order Placed Sound
  const playOrderSuccessSound = () => {
    try {
      if (!successAudioRef.current) {
        successAudioRef.current = new Audio(orderPlacedSound);
        successAudioRef.current.volume = 0.6;
      }
      successAudioRef.current.currentTime = 0;
      successAudioRef.current.play().catch((err) => {
        if (err.name === "NotAllowedError") {
          toast("🔇 Tap here to enable sounds", {
            icon: "🔊",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        }
      });
    } catch (error) {
      // Audio playback error - non-critical
    }
  };

  // 🔊 Play Order Preparing Sound (YOUR TONE)
  const playOrderPreparingSound = () => {
    try {
      if (preparingAudioRef.current) {
        preparingAudioRef.current.currentTime = 0;
        const playPromise = preparingAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            new Audio(orderPreparingSound).play().catch(() => {});
          });
        }
      } else {
        new Audio(orderPreparingSound).play().catch(() => {});
      }
    } catch (error) {
      // Audio playback error - non-critical
    }
  };

  // 🔊 Play Order Served Sound
  const playOrderServedSound = () => {
    try {
      if (!servedAudioRef.current) {
        servedAudioRef.current = new Audio(orderServedSound);
        servedAudioRef.current.volume = 0.6;
      }
      servedAudioRef.current.currentTime = 0;
      servedAudioRef.current.play().catch((err) => {
        if (err.name === "NotAllowedError") {
          toast("🔇 Tap here to enable sounds", {
            icon: "🔊",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        }
      });
    } catch (error) {
      // Audio playback error - non-critical
    }
  };

  // 🔊 Play Order Completed Sound
  const playOrderCompletedSound = () => {
    try {
      if (!completedAudioRef.current) {
        completedAudioRef.current = new Audio(orderCompletedSound);
        completedAudioRef.current.volume = 0.6;
      }
      completedAudioRef.current.currentTime = 0;
      completedAudioRef.current.play().catch((err) => {
        if (err.name === "NotAllowedError") {
          toast("🔇 Tap here to enable sounds", {
            icon: "🔊",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        }
      });
    } catch (error) {
      // Audio playback error - non-critical
    }
  };

  // 🔊 Play Order Deleted Sound
  const playOrderDeletedSound = () => {
    try {
      if (!deletedAudioRef.current) {
        deletedAudioRef.current = new Audio(orderDeletedSound);
        deletedAudioRef.current.volume = 0.6;
      }
      deletedAudioRef.current.currentTime = 0;
      deletedAudioRef.current.play().catch((err) => {
        if (err.name === "NotAllowedError") {
          toast("🔇 Tap here to enable sounds", {
            icon: "🔊",
            style: {
              borderRadius: "10px",
              background: "#333",
              color: "#fff",
            },
          });
        }
      });
    } catch (error) {
      // Audio playback error - non-critical
    }
  };

  // 🔊 Initialize Audio Objects + Unlock
  useEffect(() => {
    audioRef.current = new Audio("/notify.mp3");
    successAudioRef.current = new Audio(orderPlacedSound);
    preparingAudioRef.current = new Audio(orderPreparingSound);
    servedAudioRef.current = new Audio(orderServedSound);
    completedAudioRef.current = new Audio(orderCompletedSound);
    deletedAudioRef.current = new Audio(orderDeletedSound);

    audioRef.current.volume = 0.5;
    successAudioRef.current.volume = 0.6;
    preparingAudioRef.current.volume = 0.6;
    servedAudioRef.current.volume = 0.6;
    completedAudioRef.current.volume = 0.6;
    deletedAudioRef.current.volume = 0.6;

    const sounds = [
      { ref: audioRef, name: "Notify" },
      { ref: successAudioRef, name: "Success" },
      { ref: preparingAudioRef, name: "Preparing" },
      { ref: servedAudioRef, name: "Served" },
      { ref: completedAudioRef, name: "Completed" },
      { ref: deletedAudioRef, name: "Deleted" },
    ];

    sounds.forEach(({ ref }) => {
      if (ref.current) {
        ref.current.preload = "auto";
      }
    });

    // 🔓 Proactive Audio Unlock
    const unlockAudio = () => {
      const allSounds = [
        audioRef.current,
        successAudioRef.current,
        preparingAudioRef.current,
        servedAudioRef.current,
        completedAudioRef.current,
        deletedAudioRef.current,
      ];

      allSounds.forEach((s) => {
        if (s) {
          const originalVolume = s.volume;
          s.volume = 0;
          s
            .play()
            .then(() => {
              s.pause();
              s.currentTime = 0;
              s.volume = originalVolume;
            })
            .catch(() => {});
        }
      });

      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("touchstart", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // 🔔 Request Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // 🔔 Helper to show system notification
  const showSystemNotification = async (title, body) => {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          registration.showNotification(title, {
            body,
            icon: "/logo.png",
            badge: "/logo.png",
            vibrate: [200, 100, 200],
            tag: 'order-update',
            renotify: true
          });
        } else {
          new Notification(title, {
            body,
            icon: "/logo.png",
          });
        }
      } catch (e) {
        console.warn("System notification error:", e);
      }
    }
  };

  /* ===========================
      🔌 FETCH & SOCKET SETUP
  ============================ */
  const fetchAllOrders = useCallback(async () => {
    try {
      const params = {};
      if (user?.uid) params.userId = user.uid;
      else if (user?.email) params.userEmail = user.email;
      
      const res = await axios.get(`${API_BASE}/api/orders`, { params });

      const userOrders = res.data.filter(
        (o) => !isCompletedStatus(o.status)
      );
      setOrders(userOrders);
    } catch {
      toast.error("Couldn't load orders.");
    }
  }, [user]);

  useEffect(() => {
    const isServerless = isServerlessPlatform();

    if (!socketRef.current) {
      if (isServerless) {
        socketRef.current = {
          on: () => {},
          off: () => {},
          emit: () => {},
          disconnect: () => {},
          connect: () => {},
          connected: false,
          metrics: { quality: "unavailable" },
        };
      } else {
        const socketConfig = getSocketConfig({
          type: "user",
          userId: user?.uid || null,
          autoConnect: true,
        });

        socketRef.current = createSocketConnection(API_BASE, socketConfig);
      }
    }
    const socket = socketRef.current;

    const socketConnectedRef = { current: false };

    const checkSocketConnection = () => {
      if (socket && typeof socket.connected !== "undefined") {
        socketConnectedRef.current = socket.connected;
      }
    };

    checkSocketConnection();

    const fetchUserOrdersForPolling = async () => {
      try {
        const params = {};
        if (user?.uid) params.userId = user.uid;
        else if (user?.email) params.userEmail = user.email;
        
        const res = await axios.get(`${API_BASE}/api/orders`, { params });
        return res.data.filter(
          (o) => !isCompletedStatus(o.status)
        );
      } catch {
        return [];
      }
    };

    // Polling (as fallback / plus) – but avoid double handling if socket is good
    if (isServerless || !socketConnectedRef.current) {
      pollingStopRef.current = pollOrders(
        fetchUserOrdersForPolling,
        // onNewOrder callback
        (newOrder) => {
          if (socketConnectedRef.current) return;

          playOrderSuccessSound();
          toast.success(`📦 Order Placed: ${newOrder.foodName}`, {
            duration: 4000,
            position: "top-center",
          });
          setMobileNotification({
            type: 'success',
            title: 'Order Placed 📦',
            message: `Your order for ${newOrder.foodName} has been placed!`
          });
          showSystemNotification(
            "Order Placed 📦",
            `Your order for ${newOrder.foodName} has been placed!`
          );

          setOrders((prev) => {
            const exists = prev.find((o) => o._id === newOrder._id);
            if (!exists) {
              return [newOrder, ...prev];
            }
            return prev;
          });
        },
        // onStatusChange callback
        (updatedOrder, oldOrder) => {
          if (socketConnectedRef.current) return;
          if (!updatedOrder || !updatedOrder._id || !user) return;

          const isUserOrder =
            updatedOrder.userEmail === user.email ||
            updatedOrder.userId === user.uid;
          if (!isUserOrder) return;

          const normalized = normalizeStatus(updatedOrder.status);

          // 🔊 Sounds based on normalized status
          if (normalized === STATUS.COMPLETED) {
            playOrderCompletedSound();
          } else if (normalized === STATUS.SERVED) {
            playOrderServedSound();
          } else if (normalized === STATUS.PREPARING) {
            playOrderPreparingSound();
            toast("👨‍🍳 Order is being prepared!", {
              icon: "🔊",
              duration: 3000,
              style: {
                borderRadius: "10px",
                background: "#3b82f6",
                color: "#fff",
              },
            });
          } else {
            playNotificationSound();
          }

          if (normalized === STATUS.COMPLETED) {
            setOrders((prev) =>
              prev.filter((o) => o._id !== updatedOrder._id)
            );
            toast.success(
              `🎉 Order Completed: ${updatedOrder.foodName}. View it in Order History!`,
              {
                duration: 6000,
                position: "top-center",
                icon: "✅",
                style: {
                  background: "#10b981",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "600",
                },
              }
            );
            showSystemNotification(
              "Order Completed 🎉",
              `Your order for ${updatedOrder.foodName} is complete!`
            );
          } else {
            setOrders((prev) => {
              const existingIndex = prev.findIndex(
                (o) => o._id === updatedOrder._id
              );
              if (existingIndex === -1) {
                return [updatedOrder, ...prev];
              } else {
                const updated = [...prev];
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  ...updatedOrder,
                };
                return updated;
              }
            });

            const statusMessages = {
              [STATUS.ORDER]: "⏳ Order Pending",
              [STATUS.PREPARING]: "👨‍🍳 Order is being prepared",
              [STATUS.SERVED]: "🍽️ Order has been served",
            };

            toast.success(
              `${
                statusMessages[normalized] || "Order status updated"
              }: ${updatedOrder.foodName}`,
              {
                duration: 4000,
                position: "top-center",
                icon: "📦",
                style: {
                  background: "#3b82f6",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "600",
                },
              }
            );
            setMobileNotification({
              type: normalized.toLowerCase(),
              title: 'Order Update 👨‍🍳',
              message: `${statusMessages[normalized] || "Status updated"}: ${updatedOrder.foodName}`
            });
            showSystemNotification(
              "Order Update 👨‍🍳",
              `${
                statusMessages[normalized] || "Status updated"
              }: ${updatedOrder.foodName}`
            );
          }

          // Payment status changes
          if (
            updatedOrder.paymentStatus !== oldOrder?.paymentStatus &&
            updatedOrder.paymentStatus === "Paid"
          ) {
            playNotificationSound();
            toast.success(
              "💰 Payment Confirmed: Your payment has been confirmed by admin.",
              {
                duration: 5000,
                icon: "✅",
                style: {
                  background: "#10b981",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "600",
                },
                position: "top-center",
              }
            );
            showSystemNotification(
              "Payment Confirmed 💰",
              "Your payment has been successfully confirmed."
            );

            setOrders((prev) =>
              prev.map((o) =>
                o._id === updatedOrder._id
                  ? {
                      ...o,
                      paymentStatus: "Paid",
                      paymentMethod: updatedOrder.paymentMethod || "UPI",
                    }
                  : o
              )
            );
          }
        },
        540
      );
    }

    socket.on("connect", () => {
      socketConnectedRef.current = true;
      checkSocketConnection();

      if (socket && typeof socket.emit === "function" && user?.uid) {
        setTimeout(() => {
          socket.emit("identify", { type: "user", userId: user.uid });
        }, 100);
      }
    });

    socket.on("identified", (data) => {
      if (data && data.type === "user") {
        socketConnectedRef.current = true;
      }
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    // newOrderPlaced
    socket.on("newOrderPlaced", (newOrder) => {
      if (
        user &&
        (newOrder.userEmail === user.email || newOrder.userId === user.uid)
      ) {
        setOrders((prev) => {
          const exists = prev.find((o) => o._id === newOrder._id);
          if (!exists) {
            return [newOrder, ...prev];
          }
          return prev;
        });
        playOrderSuccessSound();
        toast.success(`📦 Order Placed: ${newOrder.foodName}`, {
          duration: 4000,
          position: "top-center",
        });
        setMobileNotification({
          type: 'success',
          title: 'Order Placed 📦',
          message: `Your order for ${newOrder.foodName} has been placed!`
        });
        showSystemNotification(
          "Order Placed 📦",
          `Your order for ${newOrder.foodName} has been placed!`
        );
      }
      fetchAllOrders();
    });

    // orderStatusChanged
    socket.on("orderStatusChanged", (updatedOrder) => {
      if (!user || !updatedOrder || !updatedOrder._id) {
        return;
      }

      const isUserOrder =
        updatedOrder.userEmail === user.email ||
        updatedOrder.userId === user.uid;

      if (!isUserOrder) return;

      const normalized = normalizeStatus(updatedOrder.status);
      
      if (normalized === STATUS.COMPLETED) {
        playOrderCompletedSound();
      } else if (normalized === STATUS.SERVED) {
        playOrderServedSound();
      } else if (normalized === STATUS.PREPARING) {
        playOrderPreparingSound();
        toast("👨‍🍳 Order is being prepared!", {
          icon: "🔊",
          duration: 3000,
          style: {
            borderRadius: "10px",
            background: "#3b82f6",
            color: "#fff",
          },
        });
      } else {
        playNotificationSound();
      }

      if (normalized === STATUS.COMPLETED) {
        setOrders((prev) => prev.filter((o) => o._id !== updatedOrder._id));

        toast.success(
          `🎉 Order Completed: ${updatedOrder.foodName}. View it in Order History!`,
          {
            duration: 6000,
            position: "top-center",
            icon: "✅",
            style: {
              background: "#10b981",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
            },
          }
        );
        showSystemNotification(
          "Order Completed 🎉",
          `Your order for ${updatedOrder.foodName} is complete!`
        );
      } else {
        setOrders((prev) => {
          const existingIndex = prev.findIndex(
            (o) => o._id === updatedOrder._id
          );

          if (existingIndex === -1) {
            return [updatedOrder, ...prev];
          } else {
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...updatedOrder,
            };
            return updated;
          }
        });

        const statusMessages = {
          [STATUS.ORDER]: "⏳ Order Pending",
          [STATUS.PREPARING]: "👨‍🍳 Order is being prepared",
          [STATUS.SERVED]: "🍽️ Order has been served",
        };

        toast.success(
          `${
            statusMessages[normalized] || "Order status updated"
          }: ${updatedOrder.foodName}`,
          {
            duration: 4000,
            position: "top-center",
            icon: "📦",
            style: {
              background: "#3b82f6",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
            },
          }
        );
        setMobileNotification({
          type: normalized.toLowerCase(),
          title: 'Order Update 👨‍🍳',
          message: `${statusMessages[normalized] || "Status updated"}: ${updatedOrder.foodName}`
        });
        showSystemNotification(
          "Order Update 👨‍🍳",
          `${
            statusMessages[normalized] || "Status updated"
          }: ${updatedOrder.foodName}`
        );
      }
    });

    // paymentSuccess
    socket.on("paymentSuccess", (orderData) => {
      if (
        user &&
        orderData &&
        (orderData.userId === user.uid || orderData.userEmail === user.email)
      ) {
        setOrders((prev) =>
          prev.map((o) =>
            o._id === orderData._id ? { ...o, paymentStatus: "Paid" } : o
          )
        );
        toast.success(
          "💰 Payment Done! Your payment has been confirmed by admin.",
          {
            duration: 5000,
            icon: "✅",
            style: {
              background: "#10b981",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
            },
            position: "top-center",
          }
        );
        setMobileNotification({
          type: 'success',
          title: 'Payment Confirmed 💰',
          message: 'Your payment has been successfully confirmed.'
        });
        showSystemNotification(
          "Payment Confirmed 💰",
          "Your payment has been successfully confirmed."
        );
      }
      fetchAllOrders();
    });

    // orderDeleted
    socket.on("orderDeleted", (deletedOrderId) => {
      setOrders((prev) => {
        const deletedOrder = prev.find((o) => o._id === deletedOrderId);
        if (
          deletedOrder &&
          user &&
          (deletedOrder.userId === user.uid ||
            deletedOrder.userEmail === user.email)
        ) {
          playOrderDeletedSound();
          toast.error(
            `🗑️ Order Deleted: ${deletedOrder.foodName} has been removed by admin.`,
            {
              duration: 5000,
              icon: "❌",
              style: {
                background: "#ef4444",
                color: "#fff",
                fontSize: "16px",
                fontWeight: "600",
              },
              position: "top-center",
            }
          );
          setMobileNotification({
            type: 'deleted',
            title: 'Order Deleted 🗑️',
            message: `Your order for ${deletedOrder.foodName} has been removed.`
          });
          showSystemNotification(
            "Order Deleted 🗑️",
            `Your order for ${deletedOrder.foodName} has been removed.`
          );
          return prev.filter((o) => o._id !== deletedOrderId);
        }
        return prev;
      });

      fetchAllOrders();
    });

    return () => {
      socket.off("connect");
      socket.off("identified");
      socket.off("disconnect");
      socket.off("newOrderPlaced");
      socket.off("orderStatusChanged");
      socket.off("paymentSuccess");
      socket.off("orderDeleted");

      if (pollingStopRef.current) {
        pollingStopRef.current();
        pollingStopRef.current = null;
      }
    };
  }, [fetchAllOrders, user]); // ✅ Fixed: Removed 'orders' dependency to prevent re-registration loops

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders]);

  /* ===========================
      🛒 CART LOGIC
  ============================ */


  const updateQuantity = async (id, newQty) => {
    if (!user || !user.email) {
      toast.error("Please login to update cart!");
      return;
    }

    try {
      await dispatch(
        updateQuantityAsync({
          userEmail: user.email,
          foodId: id,
          quantity: Math.max(newQty, 1),
        })
      ).unwrap();
    } catch (error) {
      toast.error("Failed to update cart. Please try again.");
    }
  };

  const removeItem = async (id) => {
    if (!user || !user.email) {
      toast.error("Please login to remove items!");
      return;
    }

    try {
      await dispatch(
        removeFromCartAsync({
          userEmail: user.email,
          foodId: id,
        })
      ).unwrap();
      toast.success("Item removed from cart 🗑️");
    } catch (error) {
      toast.error("Failed to remove item. Please try again.");
    }
  };

  /* ===========================
      🧾 SUBMIT ORDER (DIRECT)
  ============================ */
  const handleSubmit = async () => {
    const isDineIn = orderType === "dine-in";

    if (!user) return toast.error("Please login first!");
    if (cart.length === 0) return toast.error("Your cart is empty!");

    if (isDineIn) {
      if (selectedTables.length === 0) {
        toast.error("Please select a table for Dine-in orders");
        return;
      }
    } else {
      if (!contactNumber.trim()) {
        toast.error("Please enter your phone number for parcel/delivery orders");
        return;
      }

      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(contactNumber.trim())) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }
    }

    setIsCreatingOrder(true);
    
    try {
      const primaryTable = isDineIn ? selectedTables[0] : null;
      
      const validatedPayload = cart.map((i) => ({
        foodName: i.name || i.foodName,
        category: i.category || "Uncategorized",
        type: i.type || "Veg",
        tables: isDineIn ? selectedTables : [],
        tableNumber: primaryTable ? primaryTable.tableNumber : 0,
        chairsBooked: primaryTable ? primaryTable.chairsBooked : 0,
        chairIndices: primaryTable ? primaryTable.chairIndices : [],
        chairLetters: primaryTable ? primaryTable.chairLetters : "",
        quantity: Number(i.quantity) || 1,
        price: Number(i.price) * Number(i.quantity) || 0,
        userId: user?.uid || "",
        userEmail: user?.email || "",
        userName: user?.displayName || "Guest User",
        image: i.image || "",
        selectedSize: i.selectedSize || null,
        isInRestaurant: isDineIn,
        contactNumber: !isDineIn ? contactNumber.trim() : "",
        deliveryLocation: null,
      }));
      
      const response = await axios.post(`${API_BASE}/api/orders/create-multiple`, validatedPayload);
      
      const newOrders = response.data.orders || [];
      setCreatedOrders(newOrders);
      
      // Clear Cart
      await dispatch(clearCartAsync(user.email)).unwrap();
      
      playOrderSuccessSound();
      toast.success(`✅ Order placed successfully!`, {
        duration: 4000,
        icon: '🎉',
      });
      
      setIsCreatingOrder(false);
      
      // Show order slip after a short delay
      setTimeout(() => {
        setShowOrderSlip(true);
      }, 100);

      fetchAllOrders();
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.message || "Failed to place order. Try again.");
      setIsCreatingOrder(false);
    }
  };

  /* ===========================
      🧭 UI
  ============================ */

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff8f3] to-white py-6 sm:py-8 md:py-12 px-3 sm:px-4 md:px-6 lg:px-10 mt-10 pb-20">
      <Toaster />
      <MobileStatusNotification 
        notification={mobileNotification} 
        onClear={() => setMobileNotification(null)} 
      />

      {/* ===== CART SECTION ===== */}
      {cart.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-gray-500 mt-12 sm:mt-20"
        >
          <p className="text-base sm:text-lg md:text-xl">
            Your cart is empty 🍽️
          </p>
          <button
            onClick={() => navigate("/menu")}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-5 sm:px-6 py-2 rounded-full font-semibold text-sm sm:text-base"
          >
            Browse Menu
          </button>
        </motion.div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start">
          {/* 🧺 Cart Items */}
          <div className="lg:col-span-2 bg-white shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full">
            {cart.map((item, i) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 py-3 sm:py-4 gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <img
                    src={item.image || "https://via.placeholder.com/100"}
                    alt={item.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">
                      {item.name}
                      {item.selectedSize && (
                        <span className="ml-2 text-xs sm:text-sm text-orange-600 font-semibold">
                          ({item.selectedSize})
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm capitalize">
                      {item.category} • {item.type}
                    </p>
                    <p className="text-red-600 font-bold mt-1 text-sm sm:text-base">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center gap-3 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-200 rounded-full font-bold text-base sm:text-lg hover:bg-gray-300 transition"
                    >
                      −
                    </button>
                    <span className="text-gray-700 font-semibold text-sm sm:text-base w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-200 rounded-full font-bold text-base sm:text-lg hover:bg-gray-300 transition"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item._id)}
                    className="text-red-600 hover:text-red-800 text-xs sm:text-sm flex items-center gap-1"
                  >
                    <FaTrashAlt /> <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 💳 Bill Summary */}
          <div className="bg-white shadow-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:sticky lg:top-10 h-fit">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
              Bill Summary
            </h3>

            {/* Order Type Selection */}
            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Order Type
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("dine-in");
                    setContactNumber("");
                  }}
                  className={`px-3 py-1.5 rounded-full border-2 text-xs sm:text-sm font-semibold transition-all ${
                    orderType === "dine-in"
                      ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                      : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Dine-in
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("parcel");
                    setSelectedTables([]);
                  }}
                  className={`px-3 py-1.5 rounded-full border-2 text-xs sm:text-sm font-semibold transition-all ${
                    orderType === "parcel"
                      ? "bg-red-50 border-red-500 text-red-700 shadow-sm"
                      : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Parcel
                </button>
              </div>
            </div>

            {/* Table Selection - Only for Dine-in */}
            {orderType === "dine-in" && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Table
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTableModal(true)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                      selectedTables.length > 0
                        ? "bg-red-50 border-red-300 text-red-700"
                        : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <FaChair className="text-sm" />
                    <span className="font-medium">
                      {selectedTables.length > 0
                        ? `${selectedTables.length} Table${
                            selectedTables.length > 1 ? "s" : ""
                          } Selected`
                        : "Select Table"}
                    </span>
                  </button>
                  {selectedTables.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTables([]);
                      }}
                      className="px-2 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Clear table selection"
                    >
                      <FaTrashAlt className="text-sm" />
                    </button>
                  )}
                </div>
                {selectedTables.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Table selection is required for Dine-in orders
                  </p>
                )}
              </div>
            )}

            {/* Phone Number Input - Only for Parcel/Delivery */}
            {orderType === "parcel" && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setContactNumber(value);
                  }}
                  placeholder="Enter 10-digit phone number"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none transition-colors text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  📞 Required for parcel/delivery orders
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-bold text-gray-800 text-base sm:text-lg">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={!user || isCreatingOrder}
              className="w-full mt-4 sm:mt-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2.5 sm:py-3 rounded-full font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isCreatingOrder ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Placing Order...
                </>
              ) : (
                <>
                  <FaShoppingBag /> Place Order
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}

      {/* ===== LIVE ORDERS SECTION ===== */}
      {orders.length > 0 && (
        <div className="mt-8 sm:mt-12 md:mt-16 max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-5 text-gray-800 px-2">
            Your Live Orders
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {orders.map((order) => {
              const nStatus = normalizeStatus(order.status);
              return (
                <div
                  key={order._id}
                  className="bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow hover:shadow-md transition"
                >
                  <h4 className="font-semibold text-gray-800 text-base sm:text-lg mb-1">
                    {order.foodName}
                    {order.selectedSize && (
                      <span className="ml-2 text-xs sm:text-sm text-orange-600 font-semibold">
                        ({order.selectedSize})
                      </span>
                    )}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 capitalize">
                    {order.category} • {order.type}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-medium text-red-600 text-sm sm:text-base">
                      ₹{Number(order.price).toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 font-semibold">
                      Qty: {order.quantity || 1}
                    </p>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm">
                    Status:{" "}
                    <span
                      className={`font-semibold ${getStatusColorClass(
                        order.status
                      )}`}
                    >
                      {nStatus}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Slip */}
      <OrderSlip
        isOpen={showOrderSlip}
        onClose={() => {
          setShowOrderSlip(false);
          // Auto scroll to live orders or navigate back to menu
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }}
        orders={createdOrders}
        totalAmount={cartTotal}
        userName={user?.displayName || "Guest User"}
        userEmail={user?.email || ""}
        orderDate={createdOrders[0]?.createdAt || new Date()}
      />

      {/* Table Selection Modal */}
      <TableSelectionModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        selectedTables={selectedTables}
        setSelectedTables={setSelectedTables}
        availableTables={EMPTY_ARRAY}

        onChairsSelected={() => {}}
      />

    </div>
  );
};

export default OrderPage;
