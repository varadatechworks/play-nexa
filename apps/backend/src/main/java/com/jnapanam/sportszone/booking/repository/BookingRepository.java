package com.jnapanam.sportszone.booking.repository;
import jakarta.persistence.LockModeType;
import com.jnapanam.sportszone.booking.model.Booking;
import com.jnapanam.sportszone.booking.model.BookingStatus;
import java.time.LocalDate;
import java.time.Instant;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
public interface BookingRepository extends JpaRepository<Booking,UUID>{
 List<Booking> findByUserIdOrderByConfirmedAtDesc(UUID userId);
 Optional<Booking> findByBookingNumberIgnoreCase(String bookingNumber);
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select b from Booking b where lower(b.bookingNumber)=lower(:bookingNumber)")
 Optional<Booking> findLockedByBookingNumber(@Param("bookingNumber") String bookingNumber);
 List<Booking> findAllByOrderByConfirmedAtDesc();
 List<Booking> findBySlot_DateOrderByConfirmedAtDesc(LocalDate date);
 List<Booking> findByStatusAndPaymentExpiresAtLessThanEqual(BookingStatus status,Instant expiresAt);
}
