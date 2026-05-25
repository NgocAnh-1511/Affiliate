package com.affiliate.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "user_balances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserBalance {

    @Id
    @Column(name = "koc_id")
    private Integer kocId;

    @Column(name = "available_balance", precision = 15, scale = 2)
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "pending_commission", precision = 15, scale = 2)
    private BigDecimal pendingCommission = BigDecimal.ZERO;

    @Column(name = "referral_commission", precision = 15, scale = 2)
    private BigDecimal referralCommission = BigDecimal.ZERO;

    @Column(name = "total_withdrawn", precision = 15, scale = 2)
    private BigDecimal totalWithdrawn = BigDecimal.ZERO;
}
