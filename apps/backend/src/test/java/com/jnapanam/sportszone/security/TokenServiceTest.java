package com.jnapanam.sportszone.security;

import static org.assertj.core.api.Assertions.*;
import com.jnapanam.sportszone.identity.model.Role;
import com.jnapanam.sportszone.identity.model.RoleName;
import com.jnapanam.sportszone.identity.model.User;
import java.util.Base64;
import javax.crypto.SecretKey;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.junit.jupiter.api.Test;

class TokenServiceTest {
    @Test void acceptsA32ByteSecret() {
        String encoded = Base64.getEncoder().encodeToString(new byte[32]);
        assertThat(TokenService.secretKey(encoded).getAlgorithm()).isEqualTo("HmacSHA256");
    }
    @Test void accessTokensUsePlayNexaIssuerByDefault() {
        String encoded = Base64.getEncoder().encodeToString(new byte[32]);
        SecretKey key = TokenService.secretKey(encoded);
        var encoder = NimbusJwtEncoder.withSecretKey(key).build();
        var service = new TokenService(encoder, new SecurityProperties(encoded, 15, 30));
        Role customerRole = org.mockito.Mockito.mock(Role.class);
        org.mockito.Mockito.when(customerRole.getName()).thenReturn(RoleName.CUSTOMER);
        User user = new User("PlayNexa User", "user@example.com", null, "hash", customerRole);

        String token = service.createAccessToken(user).value();
        JwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();

        assertThat(decoder.decode(token).getIssuer().toString()).isEqualTo("playnexa");
    }

    @Test void rejectsShortSecrets() {
        String encoded = Base64.getEncoder().encodeToString(new byte[10]);
        assertThatThrownBy(() -> TokenService.secretKey(encoded)).isInstanceOf(IllegalArgumentException.class);
    }
}
