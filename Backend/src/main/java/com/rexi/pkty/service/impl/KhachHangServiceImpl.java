package com.rexi.pkty.service.impl;

import com.rexi.pkty.entity.KhachHang;
import com.rexi.pkty.repository.KhachHangRepository;
import com.rexi.pkty.service.KhachHangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class KhachHangServiceImpl implements KhachHangService {

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Override
    public List<KhachHang> getAllKhachHang() {
        return khachHangRepository.findAll();
    }
}

