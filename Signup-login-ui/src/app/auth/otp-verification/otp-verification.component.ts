import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-otp-verification',
  templateUrl: './otp-verification.component.html',
  styleUrls: ['./otp-verification.component.css']
})
export class OtpVerificationComponent {
  otpForm: FormGroup;
  message = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.otpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  verifyOtp() {
    if (this.otpForm.valid) {
      this.authService.verifyOtp(this.otpForm.value).subscribe(
        (res) => {
          this.message = res.message;
          this.router.navigate(['/login']);
        },
        (err) => {
          this.message = err.error.message || 'Invalid OTP!';
        }
      );
    }
  }
}
