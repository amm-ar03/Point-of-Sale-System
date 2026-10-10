package com.example.pos.model;

import jakarta.persistence.*;

@Entity
@Table(name = "business_details")
public class BusinessDetails {
    @Id
    private Long id = 1L;

    private String name;
    private String address;
    private String phone;
    private String email;
    private String taxNumber;
    @Column(length = 500)
    private String footerNote;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { this.address = v; }
    public String getPhone() { return phone; }
    public void setPhone(String v) { this.phone = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getTaxNumber() { return taxNumber; }
    public void setTaxNumber(String v) { this.taxNumber = v; }
    public String getFooterNote() { return footerNote; }
    public void setFooterNote(String v) { this.footerNote = v; }
}